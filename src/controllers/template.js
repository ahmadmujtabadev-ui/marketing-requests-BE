
// import { PrismaClient } from "../../prisma/generated/client/index.js";

import { PrismaClient } from "@prisma/client";
import { ENV } from "../config/env.js";

const prisma = new PrismaClient()
import path from "path";    

function ok(res, data = {}, message = 'OK') {
  return res.status(200).json({ message, ...data });
}

function created(res, data = {}, message = 'Created') {
  return res.status(201).json({ message, ...data });
}

function bad(res, msg = 'Bad request', code = 400) {
  return res.status(code).json({ error: msg });
}

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
      finalPreviewUrl = req.file.location;
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

export async function createTemplatesBulk(req, res) {
  try {
    const { category, type, canvaUrl, titlePrefix } = req.body;
    const files = req.files || [];

    if (!files.length) {
      return bad(res, "No files uploaded");
    }

    if (!category || !type) {
      return bad(res, "Category and type are required");
    }

    if (!["residential", "commercial"].includes(type)) {
      return bad(res, "Type must be residential or commercial");
    }

    const data = files.map((file, index) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      const title = titlePrefix ? `${titlePrefix} - ${index + 1}` : base;

      return {
        title,
        category,
        type,
        previewUrl: file.location,
        canvaUrl: canvaUrl || null,
      };
    });

    const createdTemplates = await prisma.template.createMany({
      data,
      skipDuplicates: true,
    });

    return created(
      res,
      { count: createdTemplates.count },
      "Bulk templates created"
    );
  } catch (error) {
    console.error("Bulk create template error:", error);
    return bad(res, "Failed to create templates", 500);
  }
}

export async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const { title, category, type, canvaUrl, previewUrl } = req.body;

    const exists = await prisma.template.findUnique({ where: { id } });
    if (!exists) return bad(res, "Template not found", 404);

    const data= {};

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
      // overwrite previewUrl with the new S3 file URL
      data.previewUrl = req.file.location;
    } else if (previewUrl !== undefined) {
      // allow direct URL override if sent in body
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

export async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;

    const exists = await prisma.template.findUnique({ where: { id } });
    if (!exists) return bad(res, 'Template not found', 404);

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