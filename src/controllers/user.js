// import { PrismaClient } from "../../prisma/generated/client/index.js";
import { PrismaClient } from "@prisma/client";

import { signTokens } from "../middleware/auth.js";
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function toPublicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt || null,
    twoFactorEnabled: u.twoFactorEnabled ?? false,
  };
}

function ok(res, data = {}, message = 'OK') {
  return res.status(200).json({ message, ...data });
}
function created(res, data = {}, message = 'Created') {
  return res.status(201).json({ message, ...data });
}
function bad(res, msg = 'Bad request', code = 400) {
  return res.status(code).json({ error: msg });
}

export async function register(req, res) {
  const { name, email, password, role  } = req.body || {};
  if (!email || !password) return bad(res, 'Email and password are required');
  console.log('DB:', (process.env.DATABASE_URL || '').replace(/:\/\/.*@/, '://***@'));

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return bad(res, 'Email already registered', 409);

  const passwordHash = await bcrypt.hash(String(password), 12);

  const user = await prisma.user.create({
    data: { name: name || email.split('@')[0], email, passwordHash, role, isActive: true },
  });

  const tokens = signTokens(user);
  return created(res, { user: toPublicUser(user), ...tokens }, 'Signup processed');
}

export async function login(req, res) {

  const { email, password } = req.body || {};
  if (!email || !password) return bad(res, 'Email and password are required');

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      isActive: true,
      passwordHash: true,
      role:true,
    },
  });

  if (!user || !user.isActive) return bad(res, 'Invalid credentials', 401);

  const okPw = await bcrypt.compare(String(password), user.passwordHash);
  if (!okPw) return bad(res, 'Invalid credentials', 401);

  const tokens = signTokens(user); 
  return ok(res, { user: toPublicUser(user), ...tokens }, 'Login processed');
}


export async function refresh(req, res) {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return bad(res, 'Missing refreshToken');

  try {
    const payload = verifyRefresh(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) return bad(res, 'Invalid token', 401);
    const tokens = signTokens(user);
    return ok(res, tokens, 'Token refreshed');
  } catch {
    return bad(res, 'Invalid token', 401);
  }
}

export async function me(req, res) {
  const userId = req.user.id;
  console.log("userId", userId)
  if (!userId) return bad(res, 'Unauthorized', 401);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return bad(res, 'User not found', 404);
  return ok(res, { user });
}

export async function forgotPassword(req, res) {
  const { email } = req.body || {};
  if (!email) return bad(res, 'Email required');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return ok(res, {}, 'If the email exists, a reset link has been sent.');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetTokenHash: hash, passwordResetExpires: expires },
  });

  const response =
    process.env.NODE_ENV === 'development'
      ? { devToken: rawToken }
      : {};

  return ok(res, response, 'If the email exists, a reset link has been sent.');
}

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return bad(res, 'Token and newPassword required');

  const hash = crypto.createHash('sha256').update(String(token)).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hash,
      passwordResetExpires: { gt: new Date() },
    },
  });
  if (!user) return bad(res, 'Invalid or expired reset token', 400);

  const passwordHash = await bcrypt.hash(String(newPassword), 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    },
  });

  return ok(res, {}, 'Password reset');
}

export async function changePassword(req, res) {
  const userId = req.user?.sub;
  if (!userId) return bad(res, 'Unauthorized', 401);

  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return bad(res, 'oldPassword and newPassword required');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return bad(res, 'User not found', 404);

  const okPw = await bcrypt.compare(String(oldPassword), user.passwordHash);
  if (!okPw) return bad(res, 'Old password incorrect', 400);

  const passwordHash = await bcrypt.hash(String(newPassword), 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return ok(res, {}, 'Password changed');
}

export async function toggle2FA(req, res) {
  const userId = req.user?.sub;
  if (!userId) return bad(res, 'Unauthorized', 401);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return bad(res, 'User not found', 404);

  const next = !(user.twoFactorEnabled ?? false);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: next },
  });

  return ok(res, { twoFactorEnabled: updated.twoFactorEnabled }, '2FA flag toggled');
}

export async function updateUser(req, res) {
  const authUserId = req.user?.id;
  console.log("authUserId", authUserId)

  if (!authUserId) return bad(res, 'Unauthorized', 401);

  const {
    name,
    email,
    role,
    isActive,
    twoFactorEnabled,
    position,
    phoneNumber,
    website,
    about,
    profileImage,
    socialLinks,
  } = req.body || {};

  try {
   
    const data = {};
    if (typeof name !== 'undefined') data.name = name;
    if (typeof email !== 'undefined') data.email = email;
    if (typeof role !== 'undefined') data.role = role;
    if (typeof isActive !== 'undefined') data.isActive = isActive;
    if (typeof twoFactorEnabled !== 'undefined') data.twoFactorEnabled = twoFactorEnabled;

    if (typeof position !== 'undefined') data.position = position;
    if (typeof phoneNumber !== 'undefined') data.phoneNumber = phoneNumber;
    if (typeof website !== 'undefined') data.website = website;
    if (typeof about !== 'undefined') data.about = about;
    if (typeof profileImage !== 'undefined') data.profileImage = profileImage;
    if (typeof socialLinks !== 'undefined') data.socialLinks = socialLinks;

    const updated = await prisma.user.update({
      where: { id: authUserId },
      data,
    });

    return ok(res, { user: updated }, 'User updated');
  } catch (err) {
    console.error('updateUser error:', err);

    if (err.code === 'P2025') {
      return bad(res, 'User not found', 404);
    }

    return bad(res, 'Failed to update user', 500);
  }
}

export async function deleteUser(req, res) {
  const authUserId = req.user?.id || req.user?.sub;
  const authUserRole = req.user?.role;

  if (!authUserId) return bad(res, 'Unauthorized', 401);
  if (authUserRole !== 'admin') return bad(res, 'Forbidden', 403);

  const userId = req.params.id;
  if (!userId) return bad(res, 'User ID is required', 400);

  if (authUserId === userId) {
    return bad(res, 'You cannot delete your own account', 400);
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    return ok(res, {}, 'User deleted');
  } catch (err) {
    console.error('deleteUser error:', err);

    if (err.code === 'P2025') {
      return bad(res, 'User not found', 404);
    }

    return bad(res, 'Failed to delete user', 500);
  }
}

function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

export async function getDashboardStats(req, res) {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!userId) return bad(res, 'Unauthorized', 401);
  if (userRole !== 'agent') return bad(res, 'Access denied. Agent role required.', 403);

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalRequests,
      statusCounts,
      thisMonthCompleted,
      lastMonthCompleted,
      thisWeekRequests,
      recentRequests,
    ] = await Promise.all([
      prisma.request.count({
        where: { agentId: userId },
      }),

      prisma.request.groupBy({
        by: ['status'],
        where: { agentId: userId },
        _count: { id: true },
      }),

      prisma.request.count({
        where: {
          agentId: userId,
          status: 'completed',
          createdAt: { gte: startOfMonth },
        },
      }),

      prisma.request.count({
        where: {
          agentId: userId,
          status: 'completed',
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      prisma.request.count({
        where: {
          agentId: userId,
          createdAt: { gte: oneWeekAgo },
        },
      }),

      prisma.request.findMany({
        where: { agentId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          projectTitle: true,
          status: true,
          createdAt: true,
          template: {
            select: {
              title: true,
            },
          },
        },
      }),
    ]);

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {});

    const pendingRequests = (statusMap.new || 0) + (statusMap.revision || 0);
    const inProgressRequests = statusMap.progress || 0;
    const completedRequests = statusMap.completed || 0;

    let monthTrend = 0;
    if (lastMonthCompleted > 0) {
      monthTrend = Math.round(
        ((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100
      );
    } else if (thisMonthCompleted > 0) {
      monthTrend = 100;
    }

    const formattedRecentRequests = recentRequests.map((request) => {
      const timeAgo = getRelativeTime(request.createdAt);
      return {
        id: request.id,
        title: request.projectTitle,
        status: request.status,
        date: timeAgo,
        template: request.template.title,
      };
    });

    const stats = {
      overview: {
        totalRequests,
        pendingRequests,
        inProgressRequests,
        completedRequests,
        thisWeekRequests,
        thisMonthCompleted,
        monthTrend,
      },
      statusBreakdown: {
        new: statusMap.new || 0,
        progress: statusMap.progress || 0,
        revision: statusMap.revision || 0,
        completed: statusMap.completed || 0,
      },
      recentRequests: formattedRecentRequests,
    };

    return ok(res, { stats }, 'Dashboard stats retrieved');
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return bad(res, 'Failed to fetch dashboard stats', 500);
  }
}