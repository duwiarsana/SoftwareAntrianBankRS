import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

// Get all counters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const counters = await prisma.counter.findMany({
      where: { orgId: req.user.orgId },
      include: { service: true },
      orderBy: { name: 'asc' },
    });
    res.json({ counters });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get counters for org (public)
router.get('/public/:orgSlug', async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: req.params.orgSlug },
    });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    const counters = await prisma.counter.findMany({
      where: { orgId: org.id, isActive: true },
      include: { service: true },
      orderBy: { name: 'asc' },
    });
    res.json({ counters });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create counter
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, serviceId } = req.body;
    const counter = await prisma.counter.create({
      data: { name, serviceId: serviceId || null, orgId: req.user.orgId },
      include: { service: true },
    });
    res.status(201).json({ counter });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat loket' });
  }
});

// Update counter
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, serviceId, isActive } = req.body;
    const counter = await prisma.counter.update({
      where: { id: req.params.id },
      data: { name, serviceId: serviceId || null, isActive },
      include: { service: true },
    });
    res.json({ counter });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate loket' });
  }
});

// Delete counter
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await prisma.counter.delete({ where: { id: req.params.id } });
    res.json({ message: 'Loket dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus loket' });
  }
});

export default router;
