
// import { PrismaClient } from "../../prisma/generated/client/index.js";

import { PrismaClient } from "@prisma/client";
import { ENV } from "../config/env.js";

const prisma = new PrismaClient()

function ok(res, data = {}, message = 'OK') {
  return res.status(200).json({ message, ...data });
}

function created(res, data = {}, message = 'Created') {
  return res.status(201).json({ message, ...data });
}

function bad(res, msg = 'Bad request', code = 400) {
  return res.status(code).json({ error: msg });
}

// GET /api/templates - Get all templates (with optional filters)
export async function getTemplates(req, res) {
  try {
    const { category, type } = req.query;
    console.log("category", category)
    console.log("type", type)


    const where = {};
    if (category) where.category = category;
    if (type) where.type = type;

    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return ok(res, { templates }, 'Templates retrieved');
  } catch (error) {
    console.error('Get templates error:', error);
    return bad(res, 'Failed to fetch templates', 500);
  }
}

// GET /api/templates/:id - Get single template
export async function getTemplate(req, res) {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id }
    });

    if (!template) return bad(res, 'Template not found', 404);

    return ok(res, { template }, 'Template retrieved');
  } catch (error) {
    console.error('Get template error:', error);
    return bad(res, 'Failed to fetch template', 500);
  }
}

export async function createTemplate(req, res) {
  try {
    const { title, category, type, canvaUrl, previewUrl } = req.body;

    if (!title || !category || !type) {
      return bad(res, "Title, category, and type are required");
    }

    if (!["residential", "commercial"].includes(type)) {
      return bad(res, "Type must be residential or commercial");
    }

    let finalPreviewUrl = previewUrl || null;

    if (req.file) {
      finalPreviewUrl = `${ENV.BASE_URL}/uploads/templates/${req.file.filename}`;
    }

    const template = await prisma.template.create({
      data: {
        title,
        category,
        type,
        previewUrl: finalPreviewUrl,
        canvaUrl: canvaUrl || null,
      },
    });

    return created(res, { template }, "Template created");
  } catch (error) {
    console.error("Create template error:", error);
    return bad(res, "Failed to create template", 500);
  }
}

export async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const { title, category, type, canvaUrl, previewUrl } = req.body;

    const exists = await prisma.template.findUnique({ where: { id } });
    if (!exists) return bad(res, "Template not found", 404);

    const data = {};

    if (title !== undefined) data.title = title;
    if (category !== undefined) data.category = category;

    if (type !== undefined) {
      if (!["residential", "commercial"].includes(type)) {
        return bad(res, "Type must be residential or commercial");
      }
      data.type = type;
    }

    if (canvaUrl !== undefined) data.canvaUrl = canvaUrl;

    if (req.file) {
      const fileUrl = `${ENV.BASE_URL}/uploads/templates/${req.file.filename}`;
      data.previewUrl = fileUrl;
    } else if (previewUrl !== undefined) {
      data.previewUrl = previewUrl;
    }

    const template = await prisma.template.update({
      where: { id },
      data,
    });

    return ok(res, { template }, "Template updated");
  } catch (error) {
    console.error("Update template error:", error);
    return bad(res, "Failed to update template", 500);
  }
}

// DELETE /api/templates/:id - Delete template (Admin only)
export async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;

    const exists = await prisma.template.findUnique({ where: { id } });
    if (!exists) return bad(res, 'Template not found', 404);

    // Check if template is used in any requests
    const requestCount = await prisma.request.count({
      where: { templateId: id }
    });

    if (requestCount > 0) {
      return bad(res, `Cannot delete template. It is used in ${requestCount} request(s)`, 400);
    }

    await prisma.template.delete({ where: { id } });

    return ok(res, {}, 'Template deleted');
  } catch (error) {
    console.error('Delete template error:', error);
    return bad(res, 'Failed to delete template', 500);
  }
}

// GET /api/templates/categories - Get all unique categories
export async function getCategories(req, res) {
  try {
    const { type } = req.query;

    const where = type ? { type } : {};

    const templates = await prisma.template.findMany({
      where,
      select: { category: true },
      distinct: ['category']
    });

    const categories = templates.map(t => t.category).filter(Boolean).sort();

    return ok(res, { categories }, 'Categories retrieved');
  } catch (error) {
    console.error('Get categories error:', error);
    return bad(res, 'Failed to fetch categories', 500);
  }
}