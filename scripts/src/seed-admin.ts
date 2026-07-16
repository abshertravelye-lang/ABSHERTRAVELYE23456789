/**
 * Seed script: create the initial super_admin user if none exists.
 * Run: pnpm --filter @workspace/scripts run seed:admin
 */
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, isNull, and } from "drizzle-orm";

const ADMIN_EMAIL = "admin@absher.com";
const ADMIN_PASSWORD = "Absher@2024!";

async function main() {
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.email, ADMIN_EMAIL), isNull(usersTable.deletedAt)));

  if (existing.length > 0) {
    console.log("Admin user already exists:", ADMIN_EMAIL);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const [user] = await db.insert(usersTable).values({
    email: ADMIN_EMAIL,
    passwordHash,
    firstName: "مدير",
    lastName: "النظام",
    role: "super_admin",
    isActive: true,
  }).returning({ id: usersTable.id, email: usersTable.email, role: usersTable.role });

  console.log("✅ Admin user created:");
  console.log("   Email:", user.email);
  console.log("   Password:", ADMIN_PASSWORD);
  console.log("   Role:", user.role);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
