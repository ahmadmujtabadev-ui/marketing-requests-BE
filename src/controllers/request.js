import { PrismaClient } from "../generated/client/index.js";

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

// GET /api/requests - Get all requests (role-based filtering)
export async function getRequests(req, res) {
  try {
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    const { status } = req.query;

    const where = {};
    
    // Agents see only their own requests
    if (userRole === 'agent') {
      where.agentId = userId;
    }
    // VAs and Admins see all requests
    
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

// GET /api/requests/:id - Get single request
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

    // Agents can only see their own requests
    if (userRole === 'agent' && request.agentId !== userId) {
      return bad(res, 'Unauthorized', 403);
    }

    return ok(res, { request }, 'Request retrieved');
  } catch (error) {
    console.error('Get request error:', error);
    return bad(res, 'Failed to fetch request', 500);
  }
}

// POST /api/requests - Submit new request (Agent only)
export async function createRequest(req, res) {
  try {
    const agentId = req.user?.id;
    console.log("AentId",agentId)
    const { templateId, projectTitle, notes, fileUrls } = req.body;

    // Validation
    if (!templateId || !projectTitle) {
      return bad(res, 'Template ID and project title are required');
    }

    // Verify template exists
    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) return bad(res, 'Template not found', 404);

    // Create request
    const request = await prisma.request.create({
      data: {
        agentId,
        templateId,
        projectTitle,
        notes: notes || null,
        status: 'new'
      },
      include: {
        agent: {
          select: { id: true, name: true, email: true }
        },
        template: {
          select: { id: true, title: true, category: true, type: true }
        }
      }
    });

    // Create file records if provided
    if (fileUrls && Array.isArray(fileUrls) && fileUrls.length > 0) {
      await prisma.requestFile.createMany({
        data: fileUrls.map(url => ({
          requestId: request.id,
          fileUrl: url,
          fileType: 'agent_upload'
        }))
      });
    }

    // Fetch complete request with files
    const completeRequest = await prisma.request.findUnique({
      where: { id: request.id },
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

    return created(res, { request: completeRequest }, 'Request submitted');
  } catch (error) {
    console.error('Create request error:', error);
    return bad(res, 'Failed to create request', 500);
  }
}

// PUT /api/requests/:id/status - Update request status (VA/Admin)
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

// POST /api/requests/:id/files - Upload completed files (VA only)
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

// DELETE /api/requests/:id/files/:fileId - Delete file
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

// PUT /api/requests/:id/notes - Update request notes (Agent can update their own)
export async function updateRequestNotes(req, res) {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    const request = await prisma.request.findUnique({ where: { id } });
    if (!request) return bad(res, 'Request not found', 404);

    // Agents can only update their own requests
    if (userRole === 'agent' && request.agentId !== userId) {
      return bad(res, 'Unauthorized', 403);
    }

    const updated = await prisma.request.update({
      where: { id },
      data: { notes },
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

    return ok(res, { request: updated }, 'Notes updated');
  } catch (error) {
    console.error('Update notes error:', error);
    return bad(res, 'Failed to update notes', 500);
  }
}

// GET /api/requests/stats - Get request statistics (for dashboards)
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