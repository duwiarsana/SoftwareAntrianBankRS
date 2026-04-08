import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../index.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `ad-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Format file tidak didukung'));
  },
});

const router = Router();

// Get ads for display (public)
router.get('/public/:orgSlug', async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({ where: { slug: req.params.orgSlug } });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    const ads = await prisma.advertisement.findMany({
      where: { orgId: org.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ advertisements: ads });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all ads (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const ads = await prisma.advertisement.findMany({
      where: { orgId: req.user.orgId },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ advertisements: ads });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create ad
router.post('/', authMiddleware, adminOnly, upload.single('media'), async (req, res) => {
  try {
    const { title, duration, mediaType } = req.body;
    const count = await prisma.advertisement.count({ where: { orgId: req.user.orgId } });

    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : req.body.mediaUrl || '';
    const ad = await prisma.advertisement.create({
      data: {
        title,
        mediaUrl,
        mediaType: mediaType || 'IMAGE',
        duration: parseInt(duration) || 5,
        sortOrder: count,
        orgId: req.user.orgId,
      },
    });
    res.status(201).json({ advertisement: ad });
  } catch (err) {
    console.error('Create ad error:', err);
    res.status(500).json({ error: 'Gagal membuat iklan' });
  }
});

// Update ad
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, isActive, duration, sortOrder } = req.body;
    const ad = await prisma.advertisement.update({
      where: { id: req.params.id },
      data: { title, isActive, duration: duration ? parseInt(duration) : undefined, sortOrder },
    });
    res.json({ advertisement: ad });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate iklan' });
  }
});

// Delete ad
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await prisma.advertisement.delete({ where: { id: req.params.id } });
    res.json({ message: 'Iklan dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus iklan' });
  }
});

export default router;
