const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
if (match) {
  process.env.DATABASE_URL = match[1];
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  await prisma.verificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  const result = await prisma.user.deleteMany();
  console.log("Deleted", result.count, "users.");
  await prisma.$disconnect();
})();
