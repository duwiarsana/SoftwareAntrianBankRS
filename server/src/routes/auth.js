import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../index.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { sendRegistrationReport } from '../services/email.js';

const router = Router();

// Configure Google OAuth Client (Needs GOOGLE_CLIENT_ID in .env)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to get IP Location
async function getIpLocation(ip) {
  try {
    // Basic check to strip IPv6 mapped IPv4 before calling API, e.g. ::ffff:192.168.1.1
    let cleanIp = ip;
    if (cleanIp && cleanIp.includes('::ffff:')) {
      cleanIp = cleanIp.split('::ffff:')[1];
    }
    // Only call API if it's a valid remote IP (avoid calling for localhost to save rate limits)
    if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1') return null;

    // Use a free IP geolocation API
    const response = await fetch(`http://ip-api.com/json/${cleanIp}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status === 'success') {
      return {
        location: `${data.city}, ${data.country}`,
        lat: data.lat,
        lon: data.lon
      };
    }
    return null;
  } catch (error) {
    console.error('IP location error:', error);
    return null;
  }
}

// Register new organization + admin user
router.post('/register', async (req, res) => {
  try {
    const { orgName, name, email, password } = req.body;

    if (!orgName || !name || !email || !password) {
      return res.status(400).json({ error: 'Semua field harus diisi' });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ipLocation = await getIpLocation(ipAddress);

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
          ipAddress: ipAddress || null,
          ipLocation: ipLocation ? ipLocation.location : null,
          ipLat: ipLocation ? ipLocation.lat : null,
          ipLon: ipLocation ? ipLocation.lon : null,
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

    // Send email report asynchronously
    sendRegistrationReport({
      name,
      email,
      orgName,
      ipAddress,
      ipLocation: ipLocation ? ipLocation.location : null,
      ipLat: ipLocation ? ipLocation.lat : null,
      ipLon: ipLocation ? ipLocation.lon : null
    }).catch(err => console.error('Email report background error:', err));

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

// Google Authentication Route (Login / Auto-Register)
router.post('/google', async (req, res) => {
  try {
    const { credential, orgName } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Token Google tidak valid' });
    }

    // Verify token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Informasi Google tidak lengkap' });
    }

    const { sub: googleId, email, name } = payload;

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { org: true },
    });

    // IF EXISTS: Just login (Optionally update googleId if not linked yet)
    if (user) {
      if (!user.googleId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      }

      const token = generateToken(user);
      return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId },
        org: { id: user.org.id, name: user.org.name, slug: user.org.slug },
      });
    }

    // IF DOES NOT EXIST: Proceed to register, but requires orgName
    if (!orgName) {
      return res.status(400).json({ 
        error: 'Nama organisasi dibutuhkan untuk pendaftaran pertama kali.',
        requireOrg: true 
      });
    }

    // Setup new registration with Google
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ipLocation = await getIpLocation(ipAddress);

    let slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existingOrg = await prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

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

      const newUser = await tx.user.create({
        data: {
          email,
          name,
          googleId,
          role: 'ADMIN',
          orgId: org.id,
          ipAddress: ipAddress || null,
          ipLocation: ipLocation ? ipLocation.location : null,
          ipLat: ipLocation ? ipLocation.lat : null,
          ipLon: ipLocation ? ipLocation.lon : null,
          // no password needed
        },
      });

      // Default services
      await tx.service.createMany({
        data: [
          { name: 'Teller', prefix: 'A', icon: '🏦', orgId: org.id, sortOrder: 0 },
          { name: 'Customer Service', prefix: 'B', icon: '💼', orgId: org.id, sortOrder: 1 },
          { name: 'Informasi', prefix: 'C', icon: '📋', orgId: org.id, sortOrder: 2 },
        ],
      });

      // Default counters
      await tx.counter.createMany({
        data: [
          { name: 'Loket 1', orgId: org.id },
          { name: 'Loket 2', orgId: org.id },
          { name: 'Loket 3', orgId: org.id },
        ],
      });

      return { org, user: newUser };
    });

    const token = generateToken(result.user);

    // Send email report asynchronously
    sendRegistrationReport({
      name,
      email,
      orgName,
      ipAddress,
      ipLocation: ipLocation ? ipLocation.location : null,
      ipLat: ipLocation ? ipLocation.lat : null,
      ipLon: ipLocation ? ipLocation.lon : null
    }).catch(err => console.error('Email report background error:', err));

    return res.status(201).json({
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
    console.error('Google endpoint error:', err);
    res.status(500).json({ error: 'Registrasi Google gagal' });
  }
});

export default router;
