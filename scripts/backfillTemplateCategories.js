// scripts/backfillTemplateCategories.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillTemplateCategories() {
  // 1) Get legacy templates that have category text but no categoryId
  const templates = await prisma.template.findMany({
    where: {
      categoryId: null,
      category: { not: null },
    },
    select: { id: true, category: true },
  });

  console.log("Legacy templates:", templates.length);

  // 2) Unique category names
  const names = Array.from(
    new Set(
      templates
        .map((t) => (t.category || "").trim())
        .filter(Boolean)
    )
  );
  console.log("Unique legacy category names:", names.length);

  // 3) Existing categories from Category table
  const existing = await prisma.category.findMany({
    where: { name: { in: names } },
  });

  const byName = new Map(
    existing.map((c) => [c.name.trim().toLowerCase(), c])
  );

  // 4) Create missing categories
  for (const rawName of names) {
    const key = rawName.trim().toLowerCase();
    if (!byName.has(key)) {
      const created = await prisma.category.create({
        data: {
          name: rawName,
          description: "Auto-migrated legacy category",
          isActive: true,
          order: 0,
        },
      });
      byName.set(key, created);
      console.log("Created category:", created.name);
    }
  }

  // 5) Backfill categoryId for each template
  for (const t of templates) {
    if (!t.category) continue;

    const key = t.category.trim().toLowerCase();
    const cat = byName.get(key);

    if (!cat) {
      console.warn("No category found for template", t.id, "name:", t.category);
      continue;
    }

    await prisma.template.update({
      where: { id: t.id },
      data: {
        categoryId: cat.id,   // FK
        category: cat.name,   // normalized name
      },
    });
  }

  console.log("✅ Backfill complete");
}

backfillTemplateCategories()
  .catch((err) => {
    console.error("Backfill error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
