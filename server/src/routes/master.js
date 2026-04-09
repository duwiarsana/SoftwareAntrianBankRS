import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, superAdminOnly } from '../middleware/auth.js';

const router = Router();

// Stats for all organizations
router.get('/stats', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const [orgCount, userCount, ticketCount, serviceCount] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.ticket.count(),
      prisma.service.count(),
    ]);

    res.json({
      orgCount,
      userCount,
      ticketCount,
      serviceCount,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil statistik global' });
  }
});

// List all organizations with details
router.get('/organizations', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            tickets: true,
            services: true,
          }
        },
        users: {
          where: { role: 'ADMIN' },
          select: { name: true, email: true, ipLocation: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil daftar organisasi' });
  }
});

// Delete an organization
router.delete('/organizations/:id', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Deleting organization will cascade delete users, services, tickets due to DB relations
    await prisma.organization.delete({
      where: { id }
    });

    res.json({ message: 'Organisasi berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus organisasi' });
  }
});

export default router;
