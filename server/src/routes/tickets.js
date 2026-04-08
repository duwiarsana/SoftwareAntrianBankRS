import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Create ticket (kiosk - public)
router.post('/', async (req, res) => {
  try {
    const { serviceId, orgSlug } = req.body;

    const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return res.status(404).json({ error: 'Layanan tidak ditemukan' });

    // Get today's ticket count for this service
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await prisma.ticket.count({
      where: {
        serviceId,
        orgId: org.id,
        createdAt: { gte: today },
      },
    });

    const displayNumber = todayCount + 1;
    const ticketNumber = `${service.prefix}-${String(displayNumber).padStart(3, '0')}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        displayNumber,
        serviceId,
        orgId: org.id,
      },
      include: { service: true },
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`org:${org.id}`).emit('ticket:new', {
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          displayNumber: ticket.displayNumber,
          status: ticket.status,
          serviceName: service.name,
          servicePrefix: service.prefix,
          createdAt: ticket.createdAt,
        },
      });
    }

    res.status(201).json({ ticket });
  } catch (err) {
    console.error('Create ticket error:', err);
    res.status(500).json({ error: 'Gagal membuat tiket' });
  }
});

// Get current queue status (public - for display)
router.get('/current/:orgSlug', async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({ where: { slug: req.params.orgSlug } });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get calling/serving tickets
    const serving = await prisma.ticket.findMany({
      where: {
        orgId: org.id,
        status: { in: ['CALLING', 'SERVING'] },
        createdAt: { gte: today },
      },
      include: { service: true, counter: true },
      orderBy: { calledAt: 'desc' },
    });

    // Get waiting tickets
    const waiting = await prisma.ticket.findMany({
      where: {
        orgId: org.id,
        status: 'WAITING',
        createdAt: { gte: today },
      },
      include: { service: true },
      orderBy: { createdAt: 'asc' },
    });

    // Get today's stats
    const totalToday = await prisma.ticket.count({
      where: { orgId: org.id, createdAt: { gte: today } },
    });
    const doneToday = await prisma.ticket.count({
      where: { orgId: org.id, status: 'DONE', createdAt: { gte: today } },
    });

    const settings = JSON.parse(org.settings || '{}');

    res.json({
      serving,
      waiting,
      stats: { total: totalToday, done: doneToday, waiting: waiting.length, serving: serving.length },
      org: { id: org.id, name: org.name, slug: org.slug, logo: org.logo, settings },
    });
  } catch (err) {
    console.error('Get queue error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Call next ticket
router.patch('/call-next', authMiddleware, async (req, res) => {
  try {
    const { counterId, serviceId } = req.body;
    
    const counter = await prisma.counter.findUnique({ where: { id: counterId } });
    if (!counter) return res.status(404).json({ error: 'Loket tidak ditemukan' });

    // Mark any currently CALLING/SERVING ticket at this counter as DONE
    await prisma.ticket.updateMany({
      where: { counterId, status: { in: ['CALLING', 'SERVING'] } },
      data: { status: 'DONE', servedAt: new Date() },
    });

    // Find next waiting ticket for this service
    const targetServiceId = serviceId || counter.serviceId;
    const whereClause = {
      orgId: req.user.orgId,
      status: 'WAITING',
    };
    
    if (targetServiceId) {
      whereClause.serviceId = targetServiceId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    whereClause.createdAt = { gte: today };

    const nextTicket = await prisma.ticket.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    if (!nextTicket) {
      return res.json({ message: 'Tidak ada antrian menunggu', ticket: null });
    }

    // Update ticket status
    const updatedTicket = await prisma.ticket.update({
      where: { id: nextTicket.id },
      data: { status: 'CALLING', counterId, calledAt: new Date() },
      include: { service: true, counter: true },
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`org:${req.user.orgId}`).emit('ticket:call', {
        ticket: {
          id: updatedTicket.id,
          ticketNumber: updatedTicket.ticketNumber,
          displayNumber: updatedTicket.displayNumber,
          status: updatedTicket.status,
          serviceName: updatedTicket.service.name,
          servicePrefix: updatedTicket.service.prefix,
          counterName: updatedTicket.counter.name,
          counterId: updatedTicket.counterId,
          calledAt: updatedTicket.calledAt,
        },
      });
    }

    res.json({ ticket: updatedTicket });
  } catch (err) {
    console.error('Call next error:', err);
    res.status(500).json({ error: 'Gagal memanggil antrian' });
  }
});

// Recall ticket (repeat announcement)
router.patch('/:id/recall', authMiddleware, async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { service: true, counter: true },
    });

    if (!ticket) return res.status(404).json({ error: 'Tiket tidak ditemukan' });

    const io = req.app.get('io');
    if (io) {
      io.to(`org:${req.user.orgId}`).emit('ticket:call', {
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          displayNumber: ticket.displayNumber,
          status: ticket.status,
          serviceName: ticket.service.name,
          servicePrefix: ticket.service.prefix,
          counterName: ticket.counter?.name,
          counterId: ticket.counterId,
          calledAt: ticket.calledAt,
        },
        isRecall: true,
      });
    }

    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memanggil ulang' });
  }
});

// Complete ticket
router.patch('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: 'DONE', servedAt: new Date() },
      include: { service: true, counter: true },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`org:${req.user.orgId}`).emit('ticket:complete', {
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          counterId: ticket.counterId,
        },
      });
    }

    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyelesaikan tiket' });
  }
});

// Skip ticket
router.patch('/:id/skip', authMiddleware, async (req, res) => {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: 'SKIPPED' },
      include: { service: true, counter: true },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`org:${req.user.orgId}`).emit('ticket:skip', {
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          counterId: ticket.counterId,
        },
      });
    }

    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ error: 'Gagal melewati tiket' });
  }
});

// Get tickets for counter staff (today's tickets for specific service)
router.get('/counter/:counterId', authMiddleware, async (req, res) => {
  try {
    const counter = await prisma.counter.findUnique({
      where: { id: req.params.counterId },
      include: { service: true },
    });
    if (!counter) return res.status(404).json({ error: 'Loket tidak ditemukan' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereClause = {
      orgId: req.user.orgId,
      createdAt: { gte: today },
    };

    if (counter.serviceId) {
      whereClause.serviceId = counter.serviceId;
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: { service: true, counter: true },
      orderBy: { createdAt: 'asc' },
    });

    // Current serving at this counter
    const current = tickets.find(
      (t) => t.counterId === counter.id && ['CALLING', 'SERVING'].includes(t.status)
    );

    const waiting = tickets.filter((t) => t.status === 'WAITING');
    const done = tickets.filter((t) => t.status === 'DONE' && t.counterId === counter.id);

    res.json({ current, waiting, done, counter, total: tickets.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, waiting, serving, done, skipped] = await Promise.all([
      prisma.ticket.count({ where: { orgId: req.user.orgId, createdAt: { gte: today } } }),
      prisma.ticket.count({ where: { orgId: req.user.orgId, status: 'WAITING', createdAt: { gte: today } } }),
      prisma.ticket.count({ where: { orgId: req.user.orgId, status: { in: ['CALLING', 'SERVING'] }, createdAt: { gte: today } } }),
      prisma.ticket.count({ where: { orgId: req.user.orgId, status: 'DONE', createdAt: { gte: today } } }),
      prisma.ticket.count({ where: { orgId: req.user.orgId, status: 'SKIPPED', createdAt: { gte: today } } }),
    ]);

    // Average wait time (from creation to called)
    const servedTickets = await prisma.ticket.findMany({
      where: {
        orgId: req.user.orgId,
        status: 'DONE',
        calledAt: { not: null },
        createdAt: { gte: today },
      },
      select: { createdAt: true, calledAt: true },
    });

    let avgWaitTime = 0;
    if (servedTickets.length > 0) {
      const totalWait = servedTickets.reduce((sum, t) => {
        return sum + (new Date(t.calledAt) - new Date(t.createdAt));
      }, 0);
      avgWaitTime = Math.round(totalWait / servedTickets.length / 60000); // in minutes
    }

    // Per-service stats
    const services = await prisma.service.findMany({
      where: { orgId: req.user.orgId },
      include: {
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    const serviceStats = await Promise.all(
      services.map(async (s) => {
        const sWaiting = await prisma.ticket.count({
          where: { serviceId: s.id, status: 'WAITING', createdAt: { gte: today } },
        });
        const sTotal = await prisma.ticket.count({
          where: { serviceId: s.id, createdAt: { gte: today } },
        });
        return { id: s.id, name: s.name, prefix: s.prefix, icon: s.icon, waiting: sWaiting, total: sTotal };
      })
    );

    res.json({
      stats: { total, waiting, serving, done, skipped, avgWaitTime },
      serviceStats,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset queue (admin only)
router.post('/reset', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.ticket.updateMany({
      where: {
        orgId: req.user.orgId,
        status: { in: ['WAITING', 'CALLING', 'SERVING'] },
        createdAt: { gte: today },
      },
      data: { status: 'DONE' },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`org:${req.user.orgId}`).emit('queue:reset');
    }

    res.json({ message: 'Antrian berhasil direset' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mereset antrian' });
  }
});

export default router;
