import { Router } from "express";
import { db } from "@workspace/db";
import { contactMessagesTable } from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";

const router = Router();

const format = (r: typeof contactMessagesTable.$inferSelect) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
});

router.post("/contact", async (req, res) => {
  try {
    const body = SubmitContactBody.parse(req.body);
    const [row] = await db.insert(contactMessagesTable).values(body).returning();
    res.status(201).json(format(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/contact/messages", async (req, res) => {
  try {
    const rows = await db.select().from(contactMessagesTable).orderBy(contactMessagesTable.createdAt);
    res.json(rows.map(format));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/contact/messages/:id/read", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
    const { eq } = await import("drizzle-orm");
    const [row] = await db.update(contactMessagesTable).set({ read: true }).where(eq(contactMessagesTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(format(row));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
