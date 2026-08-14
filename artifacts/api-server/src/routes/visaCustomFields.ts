import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth";
import { db } from "@workspace/db";
import { visaCustomFieldsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const toResponse = (r: typeof visaCustomFieldsTable.$inferSelect) => ({
  ...r,
  options: r.options ?? [],
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

// List custom fields for a visa type
router.get("/visas/:id/custom-fields", async (req, res) => {
  try {
    const visaId = Number(req.params.id);
    const rows = await db.select().from(visaCustomFieldsTable)
      .where(eq(visaCustomFieldsTable.visaId, visaId))
      .orderBy(visaCustomFieldsTable.sortOrder);
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a custom field for a visa type
router.post("/visas/:id/custom-fields", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const visaId = Number(req.params.id);
    const { labelAr, labelEn, fieldType, isRequired, options, placeholderAr, placeholderEn, sortOrder, isActive } = req.body;
    if (!labelAr || !labelEn) {
      return res.status(400).json({ error: "labelAr and labelEn are required" });
    }
    const [row] = await db.insert(visaCustomFieldsTable).values({
      visaId,
      labelAr,
      labelEn,
      fieldType: fieldType ?? "text",
      isRequired: isRequired ?? false,
      options: options ?? [],
      placeholderAr,
      placeholderEn,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    }).returning();
    res.status(201).json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

// Update a custom field
router.patch("/visa-custom-fields/:id", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { labelAr, labelEn, fieldType, isRequired, options, placeholderAr, placeholderEn, sortOrder, isActive } = req.body;
    const [row] = await db.update(visaCustomFieldsTable)
      .set({ labelAr, labelEn, fieldType, isRequired, options, placeholderAr, placeholderEn, sortOrder, isActive, updatedAt: new Date() })
      .where(eq(visaCustomFieldsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

// Delete a custom field
router.delete("/visa-custom-fields/:id", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(visaCustomFieldsTable).where(eq(visaCustomFieldsTable.id, id));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
