import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// Register new organization + admin user
router.post('/register', async (req, res) => {
  try {
    const { orgName, name, email, password } = req.body;

    if (!orgName || !name || !email || !password) {
      return res.status(400).json({ error: 'Semua field harus diisi' });
    }

    // Check email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    // Generate slug
    let slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existingOrg = await prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create org + admin in transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          settings: JSON.stringify({
            voiceLang: 'id-ID',
            voiceRate: 0.9,
            voiceTemplate: 'Nomor antrian {number}, silakan menuju {counter}',
            theme: 'dark',
          }),
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'ADMIN',
          orgId: org.id,
        },
      });

      // Create default services
      await tx.service.createMany({
        data: [
          { name: 'Teller', prefix: 'A', icon: '🏦', orgId: org.id, sortOrder: 0 },
          { name: 'Customer Service', prefix: 'B', icon: '💼', orgId: org.id, sortOrder: 1 },
          { name: 'Informasi', prefix: 'C', icon: '📋', orgId: org.id, sortOrder: 2 },
        ],
      });

      // Create default counters
      await tx.counter.createMany({
        data: [
          { name: 'Loket 1', orgId: org.id },
          { name: 'Loket 2', orgId: org.id },
          { name: 'Loket 3', orgId: org.id },
        ],
      });

      return { org, user };
    });

    const token = generateToken(result.user);

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        orgId: result.user.orgId,
      },
      org: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Gagal mendaftar' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { org: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      },
      org: {
        id: user.org.id,
        name: user.org.name,
        slug: user.org.slug,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Gagal login' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { org: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      },
      org: {
        id: user.org.id,
        name: user.org.name,
        slug: user.org.slug,
        logo: user.org.logo,
        settings: JSON.parse(user.org.settings || '{}'),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
