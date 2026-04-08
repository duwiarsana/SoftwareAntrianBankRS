import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('1. Setting up mock data in database...');
  // Clear existing
  await prisma.user.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.service.deleteMany();
  await prisma.organization.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const org = await prisma.organization.create({
    data: {
      name: 'RS Sehat Sejahtera',
      slug: 'rs-sehat'
    }
  });

  await prisma.user.create({
    data: {
      name: 'Admin Utama',
      email: 'admin@rssehat.com',
      password: hashedPassword,
      role: 'ADMIN',
      orgId: org.id
    }
  });

  const service = await prisma.service.create({
    data: {
      name: 'Poli Umum',
      prefix: 'A',
      description: 'Layanan Poli Umum',
      orgId: org.id
    }
  });

  await prisma.counter.create({
    data: {
      name: 'Loket 1',
      orgId: org.id,
      serviceId: service.id
    }
  });

  console.log('2. Mock data created. Starting Puppeteer...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new', // use new headless
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  
  const docsDir = path.join(__dirname, '../docs/screenshots');
  
  // 1. Landing Page
  console.log('Taking screenshot of Landing Page...');
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(docsDir, 'home.png'), fullPage: true });

  // 2. Kiosk
  console.log('Taking screenshot of Kiosk...');
  await page.goto('http://localhost:5173/kiosk/rs-sehat', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(docsDir, 'kiosk.png'), fullPage: true });

  // 3. Display
  console.log('Taking screenshot of Display...');
  await page.goto('http://localhost:5173/display/rs-sehat', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(docsDir, 'display.png'), fullPage: true });

  // 4. Login
  console.log('Logging in and taking screenshot of Admin/Counter...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(docsDir, 'login.png') });

  await page.type('input[type="email"]', 'admin@rssehat.com');
  await page.type('input[type="password"]', 'password123');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);
  await new Promise(r => setTimeout(r, 2000));

  // 5. Admin Dashboard
  console.log('Taking screenshot of Admin...');
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(docsDir, 'admin.png'), fullPage: true });

  // 6. Counter
  console.log('Taking screenshot of Counter...');
  await page.goto('http://localhost:5173/counter/rs-sehat', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(docsDir, 'counter.png'), fullPage: true });

  await browser.close();
  await prisma.$disconnect();
  console.log('All screenshots captured successfully!');
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
