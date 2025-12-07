
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
    const { title, category, type, previewUrl } = req.body;

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
        canvaUrl: null,
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
    const { categoryId, type, titlePrefix } = req.body;
    const files = req.files || [];

    if (!files.length) {
      return bad(res, "No files uploaded");
    }

    if (!categoryId || !type) {
      return bad(res, "Category and type are required");
    }

    if (!["residential", "commercial"].includes(type)) {
      return bad(res, "Type must be residential or commercial");
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },
    });

    if (!category) {
      return bad(res, "Invalid category");
    }

    const data = files.map((file, index) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      const title = titlePrefix ? `${titlePrefix} - ${index + 1}` : base;

      return {
        title,
        category: category.name,
        categoryId: category._id,   // FK id  ✅
        type,
        previewUrl: file.location,
        canvaUrl: null,
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

    // from multipart/form-data, everything is a string
    const {
      title,
      type,
      canvaUrl,
      previewUrl,
      categoryId,        // NEW: preferred way to change category
      category: categoryNameBody, // optional fallback
    } = req.body;

    const exists = await prisma.template.findUnique({ where: { id } });
    if (!exists) return bad(res, "Template not found", 404);

    const data = {};

    // Title
    if (title !== undefined) {
      data.title = title;
    }

    // Category: prefer categoryId from body
    if (categoryId !== undefined && categoryId !== "") {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true },
      });

      if (!category) {
        return bad(res, "Invalid category");
      }

      data.categoryId = category.id;   // FK
      data.category = category.name;   // denormalized name for display
    } else if (categoryNameBody !== undefined) {
      // Backwards-compat: if someone sends just category name
      data.category = categoryNameBody;
    }

    // Type
    if (type !== undefined) {
      if (!["residential", "commercial"].includes(type)) {
        return bad(res, "Type must be residential or commercial");
      }
      data.type = type;
    }

    // Canva URL
    if (canvaUrl !== undefined) {
      data.canvaUrl = canvaUrl;
    }

    // Preview image
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


// Get all categories
// export const getAllCategories = async (req, res) => {
//   try {
//         console.log("categories")

//     const where = {};

//     const categories = await prisma.category.findMany({
//       where,
//       orderBy: [
//         { order: 'asc' },
//         { name: 'asc' }
//       ],
//       include: {
//         _count: {
//           select: { templates: true }
//         }
//       }
//     });

//     res.status(200).json({
//       success: true,
//       data: categories
//     });
//   } catch (error) {
//     console.error('Error fetching categories:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch categories',
//       error: error.message
//     });
//   }
// };

export const getAllCategories = async (req, res) => {
  try {


    // 1. Get categories from Category table
    const categoryWhere = {};


    const dbCategories = await prisma.category.findMany({
      where: categoryWhere,
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { templates: true }
        }
      }
    });

    // 2. Get unique categories from templates (legacy data)

    const templates = await prisma.template.findMany({
      where: {
        category: { not: null } // Only get templates with old category field
      },
      select: {
        category: true,
        type: true
      },
      distinct: ['category']
    });

    // 3. Extract unique template categories
    const templateCategories = templates
      .map(t => t.category)
      .filter(Boolean);

    // 4. Find template categories that don't exist in Category table
    const dbCategoryNames = new Set(dbCategories.map(c => c.name));
    const uniqueTemplateCategories = templateCategories.filter(
      cat => !dbCategoryNames.has(cat)
    );

    // 5. Get count for each unique template category
    const legacyCategories = await Promise.all(
      uniqueTemplateCategories.map(async (categoryName) => {
        const count = await prisma.template.count({
          where: {
            category: categoryName,
            // ...(type ? { type } : {})
          }
        });

        return {
          id: `legacy-${categoryName.replace(/\s+/g, '-').toLowerCase()}`,
          name: categoryName,
          description: 'Legacy category from templates',
          isActive: true,
          order: 1000, // Put legacy categories at the end
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: {
            templates: count
          },
          isLegacy: true // Flag to identify legacy categories
        };
      })
    );

    // 6. Merge and sort all categories
    const allCategories = [
      ...dbCategories.map(c => ({ ...c, isLegacy: false })),
      ...legacyCategories
    ].sort((a, b) => {
      // Sort by order first, then by name
      if (a.order !== b.order) return a.order - b.order;
      return a.name.localeCompare(b.name);
    });

    console.log(`✅ Categories found: ${dbCategories.length} from DB + ${legacyCategories.length} legacy`);

    res.status(200).json({
      success: true,
      data: allCategories,
      meta: {
        total: allCategories.length,
        fromDatabase: dbCategories.length,
        legacy: legacyCategories.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        templates: {
          select: {
            id: true,
            title: true,
            type: true,
            previewUrl: true
          }
        },
        _count: {
          select: { templates: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name, description, isActive, order } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, order } = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // If name is being updated, check for duplicates
    if (name && name.trim() !== existingCategory.name) {
      const duplicate = await prisma.category.findUnique({
        where: { name: name.trim() }
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;

    const category = await prisma.category.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { templates: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has templates
    if (category._count.templates > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${category._count.templates} template(s) associated with it.`,
        templatesCount: category._count.templates
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};
