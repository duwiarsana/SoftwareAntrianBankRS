import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

// Get org by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: req.params.slug },
      select: { id: true, name: true, slug: true, logo: true, settings: true },
    });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });
    org.settings = JSON.parse(org.settings || '{}');
    res.json({ org });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update org settings
router.patch('/settings', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, settings } = req.body;
    const data = {};
    if (name) data.name = name;
    if (settings) data.settings = JSON.stringify(settings);

    const org = await prisma.organization.update({
      where: { id: req.user.orgId },
      data,
    });
    org.settings = JSON.parse(org.settings);
    res.json({ org });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate organisasi' });
  }
});

// Add staff user
router.post('/staff', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'COUNTER_STAFF',
        orgId: req.user.orgId,
      },
    });

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }
    res.status(500).json({ error: 'Gagal menambah staff' });
  }
});

// Get staff list
router.get('/staff/list', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { orgId: req.user.orgId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
