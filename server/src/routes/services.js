import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

// Get services for org (public - used by kiosk)
router.get('/public/:orgSlug', async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: req.params.orgSlug },
    });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    const services = await prisma.service.findMany({
      where: { orgId: org.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ services, org: { id: org.id, name: org.name, slug: org.slug, logo: org.logo } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all services for admin
router.get('/', authMiddleware, async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { orgId: req.user.orgId },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { tickets: { where: { status: 'WAITING' } } } } },
    });
    res.json({ services });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create service
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, prefix, description, icon } = req.body;
    const count = await prisma.service.count({ where: { orgId: req.user.orgId } });
    
    const service = await prisma.service.create({
      data: {
        name,
        prefix: prefix.toUpperCase(),
        description,
        icon: icon || '📋',
        sortOrder: count,
        orgId: req.user.orgId,
      },
    });
    res.status(201).json({ service });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat layanan' });
  }
});

// Update service
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, prefix, description, icon, isActive, sortOrder } = req.body;
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: { name, prefix: prefix?.toUpperCase(), description, icon, isActive, sortOrder },
    });
    res.json({ service });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate layanan' });
  }
});

// Delete service
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await prisma.service.delete({ where: { id: req.params.id } });
    res.json({ message: 'Layanan dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus layanan' });
  }
});

export default router;
