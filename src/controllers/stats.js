// src/controllers/stats.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function ok(res, data = {}, message = 'OK') {
  return res.status(200).json({ message, ...data });
}

function bad(res, msg = 'Bad request', code = 400) {
  return res.status(code).json({ error: msg });
}

// GET /api/stats/overview - Get complete dashboard overview
export async function getOverview(req, res) {
  try {
    const [
      totalUsers,
      activeUsers,
      totalTemplates,
      residentialTemplates,
      commercialTemplates,
      totalRequests,
      requestsByStatus,
      recentRequests,
      usersByRole,
      monthlyRequests,
    ] = await Promise.all([
      // User stats
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      
      // Template stats
      prisma.template.count(),
      prisma.template.count({ where: { type: 'residential' } }),
      prisma.template.count({ where: { type: 'commercial' } }),
      
      // Request stats
      prisma.request.count(),
      prisma.request.groupBy({
        by: ['status'],
        _count: true,
      }),
      
      // Recent requests
      prisma.request.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: {
            select: { id: true, name: true, email: true }
          },
          template: {
            select: { id: true, title: true, category: true }
          }
        }
      }),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      
      // Monthly requests (last 6 months)
      getMonthlyRequestStats()
    ]);

    // Process request status counts
    const statusCounts = requestsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {});

    // Process user role counts
    const roleCounts = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count;
      return acc;
    }, {});

    const overview = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: roleCounts,
      },
      templates: {
        total: totalTemplates,
        residential: residentialTemplates,
        commercial: commercialTemplates,
      },
      requests: {
        total: totalRequests,
        new: statusCounts.new || 0,
        progress: statusCounts.progress || 0,
        revision: statusCounts.revision || 0,
        completed: statusCounts.completed || 0,
        byStatus: statusCounts,
      },
      recentActivity: recentRequests.map(req => ({
        id: req.id,
        projectTitle: req.projectTitle,
        status: req.status,
        agent: req.agent,
        template: req.template,
        createdAt: req.createdAt,
        deadline: req.deadline,
      })),
      charts: {
        monthlyRequests,
      }
    };

    return ok(res, { overview });
  } catch (error) {
    console.error('Error fetching overview:', error);
    return bad(res, 'Failed to fetch overview', 500);
  }
}

// GET /api/stats/users - Get detailed user statistics
export async function getUserStats(req, res) {
  try {
    const [
      total,
      active,
      byRole,
      recentLogins,
      newUsersThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.findMany({
        where: { lastLoginAt: { not: null } },
        orderBy: { lastLoginAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastLoginAt: true,
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    const roleCounts = byRole.reduce((acc, item) => {
      acc[item.role] = item._count;
      return acc;
    }, {});

    return ok(res, {
      stats: {
        total,
        active,
        inactive: total - active,
        byRole: roleCounts,
        newThisMonth: newUsersThisMonth,
        recentLogins,
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return bad(res, 'Failed to fetch user statistics', 500);
  }
}

// GET /api/stats/templates - Get detailed template statistics
export async function getTemplateStats(req, res) {
  try {
    const [
      total,
      byType,
      byCategory,
      mostUsed,
      recentTemplates,
    ] = await Promise.all([
      prisma.template.count(),
      prisma.template.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.template.groupBy({
        by: ['category'],
        _count: true,
      }),
      prisma.template.findMany({
        include: {
          _count: {
            select: { requests: true }
          }
        },
        orderBy: {
          requests: {
            _count: 'desc'
          }
        },
        take: 10,
      }),
      prisma.template.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: {
            select: { requests: true }
          }
        }
      })
    ]);

    const typeCounts = byType.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {});

    const categoryCounts = byCategory.reduce((acc, item) => {
      acc[item.category] = item._count;
      return acc;
    }, {});

    return ok(res, {
      stats: {
        total,
        residential: typeCounts.residential || 0,
        commercial: typeCounts.commercial || 0,
        byCategory: categoryCounts,
        mostUsed: mostUsed.map(t => ({
          ...t,
          usageCount: t._count.requests
        })),
        recent: recentTemplates.map(t => ({
          ...t,
          usageCount: t._count.requests
        })),
      }
    });
  } catch (error) {
    console.error('Error fetching template stats:', error);
    return bad(res, 'Failed to fetch template statistics', 500);
  }
}

// GET /api/stats/requests - Get detailed request statistics
export async function getRequestStats(req, res) {
  try {
    const [
      total,
      byStatus,
      avgCompletionTime,
      requestsByAgent,
      requestsByMonth,
      overdueRequests,
    ] = await Promise.all([
      prisma.request.count(),
      prisma.request.groupBy({
        by: ['status'],
        _count: true,
      }),
      getAverageCompletionTime(),
      prisma.request.groupBy({
        by: ['agentId'],
        _count: true,
        orderBy: {
          _count: {
            agentId: 'desc'
          }
        },
        take: 10,
      }),
      getMonthlyRequestStats(),
      prisma.request.count({
        where: {
          deadline: { lt: new Date() },
          status: { notIn: ['completed'] }
        }
      })
    ]);

    const statusCounts = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {});

    // Get agent details for top requesters
    const agentIds = requestsByAgent.map(r => r.agentId);
    const agents = await prisma.user.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true, email: true, role: true }
    });

    const topAgents = requestsByAgent.map(r => {
      const agent = agents.find(a => a.id === r.agentId);
      return {
        agent,
        requestCount: r._count
      };
    });

    return ok(res, {
      stats: {
        total,
        byStatus: statusCounts,
        new: statusCounts.new || 0,
        progress: statusCounts.progress || 0,
        revision: statusCounts.revision || 0,
        completed: statusCounts.completed || 0,
        overdue: overdueRequests,
        avgCompletionTime,
        topAgents,
        monthlyData: requestsByMonth,
      }
    });
  } catch (error) {
    console.error('Error fetching request stats:', error);
    return bad(res, 'Failed to fetch request statistics', 500);
  }
}

// Helper function to get monthly request stats
async function getMonthlyRequestStats() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const requests = await prisma.request.findMany({
    where: {
      createdAt: { gte: sixMonthsAgo }
    },
    select: {
      createdAt: true,
      status: true,
    }
  });

  const monthlyData = {};
  
  requests.forEach(req => {
    const monthKey = `${req.createdAt.getFullYear()}-${String(req.createdAt.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        total: 0,
        new: 0,
        progress: 0,
        revision: 0,
        completed: 0,
      };
    }
    
    monthlyData[monthKey].total++;
    monthlyData[monthKey][req.status]++;
  });

  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
}

// Helper function to calculate average completion time
async function getAverageCompletionTime() {
  const completedRequests = await prisma.request.findMany({
    where: { status: 'completed' },
    select: {
      createdAt: true,
      updatedAt: true,
    }
  });

  if (completedRequests.length === 0) return 0;

  const totalTime = completedRequests.reduce((sum, req) => {
    const timeDiff = req.updatedAt.getTime() - req.createdAt.getTime();
    return sum + timeDiff;
  }, 0);

  // Return average in hours
  return Math.round(totalTime / completedRequests.length / (1000 * 60 * 60));
}