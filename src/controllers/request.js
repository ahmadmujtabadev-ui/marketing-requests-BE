// import { PrismaClient } from "../../prisma/generated/client/index.js";
import { PrismaClient } from "@prisma/client";

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

export async function getRequests(req, res) {
  try {
    const userId = req.user.id;
    console.log("userId", userId)
    const userRole = req.user?.role;
    const { status } = req.query;

    const where = {};
    
    if (userRole === 'agent') {
      where.agentId = userId;
    }
    
    if (status) where.status = status;

    const requests = await prisma.request.findMany({
      where,
      include: {
        agent: {
          select: { id: true, name: true, email: true }
        },
        template: {
          select: { id: true, title: true, category: true, type: true }
        },
        files: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return ok(res, { requests }, 'Requests retrieved');
  } catch (error) {
    console.error('Get requests error:', error);
    return bad(res, 'Failed to fetch requests', 500);
  }
}

export async function getRequest(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        agent: {
          select: { id: true, name: true, email: true }
        },
        template: {
          select: { id: true, title: true, category: true, type: true, canvaUrl: true, previewUrl: true }
        },
        files: true
      }
    });

    if (!request) return bad(res, 'Request not found', 404);

    if (userRole === 'agent' && request.agentId !== userId) {
      return bad(res, 'Unauthorized', 403);
    }

    return ok(res, { request }, 'Request retrieved');
  } catch (error) {
    console.error('Get request error:', error);
    return bad(res, 'Failed to fetch request', 500);
  }
}

export async function createRequest(req, res) {
  try {
    const agentId = req?.user.id;
    if (!agentId) {
      return bad(res, 'Unauthorized: missing agent id from token', 401);
    }

    const { 
      templateId, 
      projectTitle, 
      deadline,
      platforms,
      dimensions,
      notes, 
      fileUrls 
    } = req.body;

    if (!templateId || !projectTitle) {
      return bad(res, 'Template ID and project title are required');
    }

    if (!deadline) {
      return bad(res, 'Deadline is required');
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return bad(res, 'At least one platform is required');
    }

    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) {
      return bad(res, 'Template not found', 404);
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return bad(res, 'Invalid deadline format');
    }

    const request = await prisma.request.create({
      data: {
        agentId,
        templateId,
        projectTitle,
        // deadline: deadlineDate,
        platforms,
        dimensions: dimensions || null,
        notes: notes || null,
        status: 'new',
      },
      include: {
        agent: {
          select: { id: true, name: true, email: true },
        },
        template: {
          select: { id: true, title: true, category: true, type: true },
        },
      },
    });

    if (fileUrls && Array.isArray(fileUrls) && fileUrls.length > 0) {
      await prisma.requestFile.createMany({
        data: fileUrls.map((url) => ({
          requestId: request.id,
          fileUrl: url,
          fileType: 'agent_upload',
        })),
      });
    }

    const completeRequest = await prisma.request.findUnique({
      where: { id: request.id },
      include: {
        agent: {
          select: { id: true, name: true, email: true },
        },
        template: {
          select: { id: true, title: true, category: true, type: true },
        },
        files: true,
      },
    });

    return created(res, { request: completeRequest }, 'Request submitted');
  } catch (error) {
    console.error('Create request error:', error);
    return bad(res, 'Failed to create request', 500);
  }
}

export async function updateRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'progress', 'revision', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return bad(res, `Status must be one of: ${validStatuses.join(', ')}`);
    }

    const exists = await prisma.request.findUnique({ where: { id } });
    if (!exists) return bad(res, 'Request not found', 404);

    const request = await prisma.request.update({
      where: { id },
      data: { status },
      include: {
        agent: {
          select: { id: true, name: true, email: true }
        },
        template: {
          select: { id: true, title: true, category: true, type: true }
        },
        files: true
      }
    });

    return ok(res, { request }, 'Request status updated');
  } catch (error) {
    console.error('Update request status error:', error);
    return bad(res, 'Failed to update request status', 500);
  }
}

export async function uploadCompletedFile(req, res) {
  try {
    const { id } = req.params;
    const { fileUrl, fileType = 'va_completed' } = req.body;

    if (!fileUrl) return bad(res, 'File URL is required');

    const exists = await prisma.request.findUnique({ where: { id } });
    if (!exists) return bad(res, 'Request not found', 404);

    const file = await prisma.requestFile.create({
      data: {
        requestId: id,
        fileUrl,
        fileType
      }
    });

    return created(res, { file }, 'File uploaded');
  } catch (error) {
    console.error('Upload file error:', error);
    return bad(res, 'Failed to upload file', 500);
  }
}

export async function deleteRequestFile(req, res) {
  try {
    const { id, fileId } = req.params;

    const file = await prisma.requestFile.findUnique({ where: { id: fileId } });
    if (!file) return bad(res, 'File not found', 404);
    if (file.requestId !== id) return bad(res, 'File does not belong to this request', 400);

    await prisma.requestFile.delete({ where: { id: fileId } });

    return ok(res, {}, 'File deleted');
  } catch (error) {
    console.error('Delete file error:', error);
    return bad(res, 'Failed to delete file', 500);
  }
}

export async function updateRequest(req, res) {
  try {
    const { id } = req.params;
    const { 
      projectTitle,
      deadline,
      platforms,
      dimensions,
      notes 
    } = req.body;
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    const request = await prisma.request.findUnique({ where: { id } });
    if (!request) return bad(res, 'Request not found', 404);

    // Agents can only update their own requests
    if (userRole === 'agent' && request.agentId !== userId) {
      return bad(res, 'Unauthorized', 403);
    }

    // Build update data object
    const updateData = {};
    
    if (projectTitle !== undefined) updateData.projectTitle = projectTitle;
    if (notes !== undefined) updateData.notes = notes;
    if (dimensions !== undefined) updateData.dimensions = dimensions;
    
    if (deadline !== undefined) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return bad(res, 'Invalid deadline format');
      }
      updateData.deadline = deadlineDate;
    }
    
    if (platforms !== undefined) {
      if (!Array.isArray(platforms) || platforms.length === 0) {
        return bad(res, 'At least one platform is required');
      }
      updateData.platforms = platforms;
    }

    const updated = await prisma.request.update({
      where: { id },
      data: updateData,
      include: {
        agent: {
          select: { id: true, name: true, email: true }
        },
        template: {
          select: { id: true, title: true, category: true, type: true }
        },
        files: true
      }
    });

    return ok(res, { request: updated }, 'Request updated');
  } catch (error) {
    console.error('Update request error:', error);
    return bad(res, 'Failed to update request', 500);
  }
}

export async function getRequestStats(req, res) {
  try {
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    const where = userRole === 'agent' ? { agentId: userId } : {};

    const [total, newCount, progressCount, revisionCount, completedCount] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.count({ where: { ...where, status: 'new' } }),
      prisma.request.count({ where: { ...where, status: 'progress' } }),
      prisma.request.count({ where: { ...where, status: 'revision' } }),
      prisma.request.count({ where: { ...where, status: 'completed' } })
    ]);

    const stats = {
      total,
      byStatus: {
        new: newCount,
        progress: progressCount,
        revision: revisionCount,
        completed: completedCount
      }
    };

    return ok(res, { stats }, 'Stats retrieved');
  } catch (error) {
    console.error('Get stats error:', error);
    return bad(res, 'Failed to fetch stats', 500);
  }
}