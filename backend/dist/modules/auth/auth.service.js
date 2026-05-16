"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const bcrypt_1 = require("../../utils/bcrypt");
const jwt_1 = require("../../utils/jwt");
class AuthService {
    // ✅ Your existing register method
    static async register(input) {
        const hashed = await (0, bcrypt_1.hashPassword)(input.password);
        try {
            const user = await prisma_1.default.user.create({
                data: {
                    first_name: input.first_name,
                    last_name: input.last_name,
                    location: input.location,
                    email: input.email.toLowerCase().trim(),
                    phone: input.phone,
                    password: hashed,
                    role: input.role || "BUYER",
                },
                select: { id: true },
            });
            return { userId: user.id };
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new Error("USER_ALREADY_EXISTS");
            }
            throw error;
        }
    }
    // ✅ Your existing login method
    static async login(input) {
        const user = await prisma_1.default.user.findUnique({
            where: { email: input.email.toLowerCase().trim() },
            select: {
                id: true,
                email: true,
                password: true,
                role: true,
                first_name: true,
                last_name: true,
            },
        });
        if (!user) {
            throw new Error("INVALID_CREDENTIALS");
        }
        const valid = await (0, bcrypt_1.comparePassword)(input.password, user.password);
        if (!valid) {
            throw new Error("INVALID_CREDENTIALS");
        }
        const token = (0, jwt_1.signToken)({
            id: user.id,
            email: user.email,
            role: user.role
        });
        return {
            token,
            user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                role: user.role
            }
        };
    }
    // ✅ Get user profile
    static async getProfile(userId) {
        const user = await prisma_1.default.user.findUnique({
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
        const cart = await prisma_1.default.cart.findUnique({
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
    static async updateProfile(userId, data) {
        return prisma_1.default.user.update({
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
    static async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true }
        });
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        const isValid = await (0, bcrypt_1.comparePassword)(currentPassword, user.password);
        if (!isValid) {
            throw new Error("INVALID_CURRENT_PASSWORD");
        }
        const hashedPassword = await (0, bcrypt_1.hashPassword)(newPassword);
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        return { success: true };
    }
    // ✅ Delete user account
    static async deleteAccount(userId, password) {
        const user = await prisma_1.default.user.findUnique({
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
        const isValid = await (0, bcrypt_1.comparePassword)(password, user.password);
        if (!isValid) {
            throw new Error("INVALID_PASSWORD");
        }
        if (user.role === "ADMIN") {
            const adminCount = await prisma_1.default.user.count({
                where: { role: "ADMIN" }
            });
            if (adminCount === 1) {
                throw new Error("CANNOT_DELETE_LAST_ADMIN");
            }
        }
        await prisma_1.default.user.delete({
            where: { id: userId }
        });
        return { success: true, message: "Account deleted successfully" };
    }
    // ✅ Soft deactivate account
    static async deactivateAccount(userId, password) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true }
        });
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        const isValid = await (0, bcrypt_1.comparePassword)(password, user.password);
        if (!isValid) {
            throw new Error("INVALID_PASSWORD");
        }
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                is_suspended: true
            }
        });
        return { success: true, message: "Account deactivated successfully" };
    }
    // ✅ Reactivate account
    static async reactivateAccount(email, password) {
        const user = await prisma_1.default.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true, password: true, isActive: true }
        });
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        const isValid = await (0, bcrypt_1.comparePassword)(password, user.password);
        if (!isValid) {
            throw new Error("INVALID_PASSWORD");
        }
        if (user.isActive) {
            throw new Error("ACCOUNT_ALREADY_ACTIVE");
        }
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                isActive: true,
                is_suspended: false
            }
        });
        return { success: true, message: "Account reactivated successfully" };
    }
    // ✅ NEW: Get all users (admin only)
    static async getAllUsers(adminId, filters) {
        // Verify the requester is admin
        const admin = await prisma_1.default.user.findUnique({
            where: { id: adminId },
            select: { role: true }
        });
        if (!admin || admin.role !== "ADMIN") {
            throw new Error("ADMIN_ACCESS_REQUIRED");
        }
        const where = {};
        if (filters?.role) {
            where.role = filters.role;
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
        const users = await prisma_1.default.user.findMany({
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
    // ✅ NEW: Promote user to admin (admin only)
    static async promoteToAdmin(adminId, targetUserId) {
        // Verify the requester is admin
        const admin = await prisma_1.default.user.findUnique({
            where: { id: adminId },
            select: { role: true }
        });
        if (!admin || admin.role !== "ADMIN") {
            throw new Error("ADMIN_ACCESS_REQUIRED");
        }
        // Check if target user exists
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, role: true, email: true }
        });
        if (!targetUser) {
            throw new Error("USER_NOT_FOUND");
        }
        if (targetUser.role === "ADMIN") {
            throw new Error("USER_ALREADY_ADMIN");
        }
        // Promote to admin
        const updatedUser = await prisma_1.default.user.update({
            where: { id: targetUserId },
            data: { role: "ADMIN" },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                role: true,
                updatedAt: true
            }
        });
        // Log the action (optional - you can create an AdminLog model)
        console.log(`Admin ${adminId} promoted user ${targetUserId} (${targetUser.email}) to ADMIN`);
        return {
            success: true,
            message: `User ${updatedUser.first_name} ${updatedUser.last_name} has been promoted to Admin`,
            data: updatedUser
        };
    }
    // ✅ NEW: Demote admin to regular user (admin only)
    static async demoteFromAdmin(adminId, targetUserId) {
        // Verify the requester is admin
        const admin = await prisma_1.default.user.findUnique({
            where: { id: adminId },
            select: { role: true }
        });
        if (!admin || admin.role !== "ADMIN") {
            throw new Error("ADMIN_ACCESS_REQUIRED");
        }
        // Prevent demoting self
        if (adminId === targetUserId) {
            throw new Error("CANNOT_DEMOTE_SELF");
        }
        // Check if target user exists
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, role: true, email: true }
        });
        if (!targetUser) {
            throw new Error("USER_NOT_FOUND");
        }
        if (targetUser.role !== "ADMIN") {
            throw new Error("USER_NOT_ADMIN");
        }
        // Check if this is the last admin
        const adminCount = await prisma_1.default.user.count({
            where: { role: "ADMIN" }
        });
        if (adminCount === 1) {
            throw new Error("CANNOT_DEMOTE_LAST_ADMIN");
        }
        // Demote to regular user (default to BUYER role)
        const updatedUser = await prisma_1.default.user.update({
            where: { id: targetUserId },
            data: { role: "BUYER" },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                role: true,
                updatedAt: true
            }
        });
        console.log(`Admin ${adminId} demoted user ${targetUserId} (${targetUser.email}) from ADMIN`);
        return {
            success: true,
            message: `User ${updatedUser.first_name} ${updatedUser.last_name} has been demoted from Admin`,
            data: updatedUser
        };
    }
    // ✅ NEW: Change user role (admin only)
    static async changeUserRole(adminId, targetUserId, newRole) {
        // Verify the requester is admin
        const admin = await prisma_1.default.user.findUnique({
            where: { id: adminId },
            select: { role: true }
        });
        if (!admin || admin.role !== "ADMIN") {
            throw new Error("ADMIN_ACCESS_REQUIRED");
        }
        // Prevent changing own role if it would remove last admin
        if (adminId === targetUserId && newRole !== "ADMIN") {
            const adminCount = await prisma_1.default.user.count({
                where: { role: "ADMIN" }
            });
            if (adminCount === 1) {
                throw new Error("CANNOT_CHANGE_LAST_ADMIN_ROLE");
            }
        }
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, role: true }
        });
        if (!targetUser) {
            throw new Error("USER_NOT_FOUND");
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: targetUserId },
            data: { role: newRole },
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
    // ✅ NEW: Suspend user account (admin only)
    static async suspendUser(adminId, targetUserId) {
        const admin = await prisma_1.default.user.findUnique({
            where: { id: adminId },
            select: { role: true }
        });
        if (!admin || admin.role !== "ADMIN") {
            throw new Error("ADMIN_ACCESS_REQUIRED");
        }
        if (adminId === targetUserId) {
            throw new Error("CANNOT_SUSPEND_SELF");
        }
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id: targetUserId }
        });
        if (!targetUser) {
            throw new Error("USER_NOT_FOUND");
        }
        const updatedUser = await prisma_1.default.user.update({
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
    // ✅ NEW: Unsuspend user account (admin only)
    static async unsuspendUser(adminId, targetUserId) {
        const admin = await prisma_1.default.user.findUnique({
            where: { id: adminId },
            select: { role: true }
        });
        if (!admin || admin.role !== "ADMIN") {
            throw new Error("ADMIN_ACCESS_REQUIRED");
        }
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id: targetUserId }
        });
        if (!targetUser) {
            throw new Error("USER_NOT_FOUND");
        }
        const updatedUser = await prisma_1.default.user.update({
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
exports.AuthService = AuthService;
