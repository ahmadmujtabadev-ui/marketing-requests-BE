import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function toPublicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt || null,
    twoFactorEnabled: u.twoFactorEnabled ?? false,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
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

export async function listUsers(req, res) {
  try {
    const { role, isActive, search, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          twoFactorEnabled: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.user.count({ where })
    ]);

    return ok(res, {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error listing users:', error);
    return bad(res, 'Failed to fetch users', 500);
  }
}

export async function getUser(req, res) {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { requests: true }
        }
      }
    });

    if (!user) return bad(res, 'User not found', 404);

    return ok(res, { user: { ...toPublicUser(user), requestCount: user._count.requests } });
  } catch (error) {
    console.error('Error fetching user:', error);
    return bad(res, 'Failed to fetch user', 500);
  }
}

export async function createUser(req, res) {
  try {
    const { name, email, password, role = 'agent' } = req.body;

    if (!email || !password) {
      return bad(res, 'Email and password are required');
    }

    if (!['admin', 'agent', 'va'].includes(role)) {
      return bad(res, 'Invalid role');
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return bad(res, 'Email already exists', 409);

    const passwordHash = await bcrypt.hash(String(password), 12);

    const user = await prisma.user.create({
      data: {
        name: name || email.split('@')[0],
        email,
        passwordHash,
        role,
        isActive: true
      }
    });

    return created(res, { user: toPublicUser(user) }, 'User created successfully');
  } catch (error) {
    console.error('Error creating user:', error);
    return bad(res, 'Failed to create user', 500);
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return bad(res, 'User not found', 404);

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      const emailExists = await prisma.user.findFirst({
        where: { email, NOT: { id } }
      });
      if (emailExists) return bad(res, 'Email already in use', 409);
      updateData.email = email;
    }
    if (role !== undefined) {
      if (!['admin', 'agent', 'va'].includes(role)) {
        return bad(res, 'Invalid role');
      }
      updateData.role = role;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return ok(res, { user: toPublicUser(updated) }, 'User updated successfully');
  } catch (error) {
    console.error('Error updating user:', error);
    return bad(res, 'Failed to update user', 500);
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.id;

    if (id === requestingUserId) {
      return bad(res, 'Cannot delete your own account', 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return bad(res, 'User not found', 404);

    await prisma.user.delete({ where: { id } });

    return ok(res, {}, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    return bad(res, 'Failed to delete user', 500);
  }
}

export async function adminResetPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return bad(res, 'Password must be at least 8 characters');
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return bad(res, 'User not found', 404);

    const passwordHash = await bcrypt.hash(String(newPassword), 12);

    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    return ok(res, {}, 'Password reset successfully');
  } catch (error) {
    console.error('Error resetting password:', error);
    return bad(res, 'Failed to reset password', 500);
  }
}

export async function toggleUserActive(req, res) {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.id;

    if (id === requestingUserId) {
      return bad(res, 'Cannot deactivate your own account', 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return bad(res, 'User not found', 404);

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    });

    return ok(res, { 
      user: toPublicUser(updated),
      isActive: updated.isActive 
    }, `User ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Error toggling user status:', error);
    return bad(res, 'Failed to toggle user status', 500);
  }
}

export async function getUserStats(req, res) {
  try {
    const [total, active, byRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      })
    ]);

    const roleStats = byRole.reduce((acc, item) => {
      acc[item.role] = item._count;
      return acc;
    }, {});

    return ok(res, {
      stats: {
        total,
        active,
        inactive: total - active,
        byRole: roleStats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return bad(res, 'Failed to fetch statistics', 500);
  }
}