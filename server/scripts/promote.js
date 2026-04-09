import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const emailToPromote = 'anakagungduwiarsana@gmail.com';

async function main() {
  try {
    const user = await prisma.user.update({
      where: { email: emailToPromote },
      data: { 
        role: 'SUPER_ADMIN' 
      },
    });
    console.log(`✅ User ${user.email} has been promoted to SUPER_ADMIN`);
  } catch (error) {
    console.error(`❌ Failed to promote user: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
