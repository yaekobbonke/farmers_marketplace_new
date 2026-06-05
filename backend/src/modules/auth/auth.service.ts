import prisma from "../../config/prisma";
import { hashPassword, comparePassword } from "../../utils/bcrypt";
import { RegisterInput, LoginInput } from "./auth.types";
import { signToken } from "../../utils/jwt";
import { Role } from "@prisma/client"; 
import { registerSchema, loginSchema } from "./auth.schema";

export class AuthService {
  // ✅ Register method with validation and proper Role enum
  static async register(input: RegisterInput): Promise<{ userId: number }> {
    // ✅ STEP 1: Validate input with Zod schema
    const validated = registerSchema.parse(input);
    
    // ✅ STEP 2: Hash the validated password
    const hashed = await hashPassword(validated.password);

    try {
      // ✅ STEP 3: Convert role string to Role enum
      let roleEnum: Role = Role.BUYER;
      if (validated.role?.toUpperCase() === "ADMIN") {
        roleEnum = Role.ADMIN;
      } else if (validated.role?.toUpperCase() === "FARMER") {
        roleEnum = Role.FARMER;
      } else {
        roleEnum = Role.BUYER;
      }

      const user = await prisma.user.create({
        data: {
          first_name: validated.first_name,
          last_name: validated.last_name,
          location: validated.location,
          email: validated.email.toLowerCase().trim(),
          phone: validated.phone,
          password: hashed,
          role: roleEnum,
        },
        select: { id: true },
      });
      return { userId: user.id };
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("USER_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  // ✅ Login method with validation - ensures role is uppercase in token
  static async login(input: LoginInput): Promise<{ token: string; user: any }> {
    // ✅ Validate login input
    const validated = loginSchema.parse(input);
    
    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        first_name: true,
        last_name: true,
        is_suspended: true,
      },
    });

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Check if user is suspended
    if (user.is_suspended) {
      throw new Error("ACCOUNT_SUSPENDED");
    }

    const valid = await comparePassword(validated.password, user.password);
    if (!valid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // ✅ Get role as string (enum value)
    const userRole = user.role as string;
    
    const token = signToken({ 
      id: user.id, 
      email: user.email, 
      role: userRole.toUpperCase(),
      is_suspended: user.is_suspended
    });

    console.log(`User logged in: ${user.email}, Role: ${userRole}`);

    return { 
      token, 
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: userRole.toUpperCase()
      }
    };
  }

  // ✅ Get user profile
  static async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        location: true,
        role: true,
        is_suspended: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            orders: true,
          }
        }
      }
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const cart = await prisma.cart.findUnique({
      where: { buyerId: userId },
      include: { items: true }
    });

    return {
      ...user,
      _count: {
        ...user._count,
        cartItems: cart?.items?.length || 0
      }
    };
  }

  // ✅ Update user profile
  static async updateProfile(userId: number, data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    location?: string;
  }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        location: data.location
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        location: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  // ✅ Change password
  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      throw new Error("INVALID_CURRENT_PASSWORD");
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return { success: true };
  }

  // ✅ Delete user account
  static async deleteAccount(userId: number, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        password: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new Error("INVALID_PASSWORD");
    }

    if (user.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN }
      });
      if (adminCount === 1) {
        throw new Error("CANNOT_DELETE_LAST_ADMIN");
      }
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return { success: true, message: "Account deleted successfully" };
  }

  // ✅ Soft deactivate account
  static async deactivateAccount(userId: number, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new Error("INVALID_PASSWORD");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        is_suspended: true
      }
    });

    return { success: true, message: "Account deactivated successfully" };
  }

  // ✅ Reactivate account
  static async reactivateAccount(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, password: true, isActive: true }
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new Error("INVALID_PASSWORD");
    }

    if (user.isActive) {
      throw new Error("ACCOUNT_ALREADY_ACTIVE");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isActive: true,
        is_suspended: false
      }
    });

    return { success: true, message: "Account reactivated successfully" };
  }

  // ✅ Get all users (admin only)
  static async getAllUsers(adminId: number, filters?: {
    role?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new Error("ADMIN_ACCESS_REQUIRED");
    }

    const where: any = {};

    if (filters?.role) {
      const roleUpper = filters.role.toUpperCase();
      if (roleUpper === "ADMIN") where.role = Role.ADMIN;
      else if (roleUpper === "FARMER") where.role = Role.FARMER;
      else if (roleUpper === "BUYER") where.role = Role.BUYER;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        location: true,
        role: true,
        isActive: true,
        is_suspended: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return users;
  }

  // ✅ Promote user to admin (admin only)
  static async promoteToAdmin(adminId: number, targetUserId: number) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new Error("ADMIN_ACCESS_REQUIRED");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, email: true }
    });

    if (!targetUser) {
      throw new Error("USER_NOT_FOUND");
    }

    if (targetUser.role === Role.ADMIN) {
      throw new Error("USER_ALREADY_ADMIN");
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: Role.ADMIN },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    console.log(`Admin ${adminId} promoted user ${targetUserId} to ADMIN`);

    return { 
      success: true, 
      message: `User ${updatedUser.first_name} ${updatedUser.last_name} has been promoted to Admin`,
      data: updatedUser
    };
  }

  // ✅ Demote admin to regular user (admin only)
  static async demoteFromAdmin(adminId: number, targetUserId: number) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new Error("ADMIN_ACCESS_REQUIRED");
    }

    if (adminId === targetUserId) {
      throw new Error("CANNOT_DEMOTE_SELF");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, email: true }
    });

    if (!targetUser) {
      throw new Error("USER_NOT_FOUND");
    }

    if (targetUser.role !== Role.ADMIN) {
      throw new Error("USER_NOT_ADMIN");
    }

    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN }
    });

    if (adminCount === 1) {
      throw new Error("CANNOT_DEMOTE_LAST_ADMIN");
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: Role.BUYER },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    console.log(`Admin ${adminId} demoted user ${targetUserId} from ADMIN`);

    return { 
      success: true, 
      message: `User ${updatedUser.first_name} ${updatedUser.last_name} has been demoted from Admin`,
      data: updatedUser
    };
  }

  // ✅ Change user role (admin only)
  static async changeUserRole(adminId: number, targetUserId: number, newRole: "ADMIN" | "FARMER" | "BUYER") {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new Error("ADMIN_ACCESS_REQUIRED");
    }

    if (adminId === targetUserId && newRole !== "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN }
      });
      if (adminCount === 1) {
        throw new Error("CANNOT_CHANGE_LAST_ADMIN_ROLE");
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true }
    });

    if (!targetUser) {
      throw new Error("USER_NOT_FOUND");
    }

    // Convert string to Role enum
    let roleEnum: Role;
    switch (newRole.toUpperCase()) {
      case "ADMIN":
        roleEnum = Role.ADMIN;
        break;
      case "FARMER":
        roleEnum = Role.FARMER;
        break;
      default:
        roleEnum = Role.BUYER;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: roleEnum },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    return { 
      success: true, 
      message: `User role changed to ${newRole}`,
      data: updatedUser
    };
  }

  // ✅ Suspend user account (admin only)
  static async suspendUser(adminId: number, targetUserId: number) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new Error("ADMIN_ACCESS_REQUIRED");
    }

    if (adminId === targetUserId) {
      throw new Error("CANNOT_SUSPEND_SELF");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      throw new Error("USER_NOT_FOUND");
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { 
        is_suspended: true,
        isActive: false
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        is_suspended: true,
        isActive: true
      }
    });

    return { 
      success: true, 
      message: `User ${updatedUser.first_name} ${updatedUser.last_name} has been suspended`,
      data: updatedUser
    };
  }

  // ✅ Unsuspend user account (admin only)
  static async unsuspendUser(adminId: number, targetUserId: number) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new Error("ADMIN_ACCESS_REQUIRED");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      throw new Error("USER_NOT_FOUND");
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { 
        is_suspended: false,
        isActive: true
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        is_suspended: true,
        isActive: true
      }
    });

    return { 
      success: true, 
      message: `User ${updatedUser.first_name} ${updatedUser.last_name} has been unsuspended`,
      data: updatedUser
    };
  }
}