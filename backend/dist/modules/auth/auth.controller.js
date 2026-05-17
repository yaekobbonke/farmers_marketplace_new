"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
class AuthController {
    // ✅ Register
    static async register(req, res) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            if (error.message === "USER_ALREADY_EXISTS") {
                return res.status(409).json({ success: false, message: "User already exists" });
            }
            console.error("Registration error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Login
    static async login(req, res) {
        try {
            const result = await auth_service_1.AuthService.login(req.body);
            res.json({ success: true, data: result });
        }
        catch (error) {
            if (error.message === "INVALID_CREDENTIALS") {
                return res.status(401).json({ success: false, message: "Invalid email or password" });
            }
            if (error.message === "ACCOUNT_SUSPENDED") {
                return res.status(403).json({ success: false, message: "Your account has been suspended. Please contact support." });
            }
            console.error("Login error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Get Profile
    static async getProfile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }
            const profile = await auth_service_1.AuthService.getProfile(userId);
            res.json({ success: true, data: profile });
        }
        catch (error) {
            if (error.message === "USER_NOT_FOUND") {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            console.error("Get profile error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Update Profile
    static async updateProfile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }
            const { first_name, last_name, phone, location } = req.body;
            const updated = await auth_service_1.AuthService.updateProfile(userId, {
                first_name,
                last_name,
                phone,
                location
            });
            res.json({ success: true, data: updated });
        }
        catch (error) {
            console.error("Update profile error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Change Password
    static async changePassword(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ success: false, message: "Current password and new password are required" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
            }
            await auth_service_1.AuthService.changePassword(userId, currentPassword, newPassword);
            res.json({ success: true, message: "Password changed successfully" });
        }
        catch (error) {
            if (error.message === "INVALID_CURRENT_PASSWORD") {
                return res.status(400).json({ success: false, message: "Current password is incorrect" });
            }
            if (error.message === "USER_NOT_FOUND") {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            console.error("Change password error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Delete Account
    static async deleteAccount(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ success: false, message: "Password is required to delete account" });
            }
            await auth_service_1.AuthService.deleteAccount(userId, password);
            res.json({ success: true, message: "Account deleted successfully", shouldLogout: true });
        }
        catch (error) {
            if (error.message === "USER_NOT_FOUND") {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            if (error.message === "INVALID_PASSWORD") {
                return res.status(401).json({ success: false, message: "Incorrect password" });
            }
            if (error.message === "CANNOT_DELETE_LAST_ADMIN") {
                return res.status(403).json({ success: false, message: "Cannot delete the last admin account" });
            }
            console.error("Delete account error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Deactivate Account
    static async deactivateAccount(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ success: false, message: "Password is required to deactivate account" });
            }
            await auth_service_1.AuthService.deactivateAccount(userId, password);
            res.json({ success: true, message: "Account deactivated successfully", shouldLogout: true });
        }
        catch (error) {
            if (error.message === "INVALID_PASSWORD") {
                return res.status(401).json({ success: false, message: "Incorrect password" });
            }
            console.error("Deactivate account error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Reactivate Account
    static async reactivateAccount(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Email and password are required" });
            }
            const result = await auth_service_1.AuthService.reactivateAccount(email, password);
            res.json(result);
        }
        catch (error) {
            if (error.message === "USER_NOT_FOUND") {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            if (error.message === "INVALID_PASSWORD") {
                return res.status(401).json({ success: false, message: "Incorrect password" });
            }
            if (error.message === "ACCOUNT_ALREADY_ACTIVE") {
                return res.status(400).json({ success: false, message: "Account is already active" });
            }
            console.error("Reactivate account error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Get All Users (Admin only)
    static async getAllUsers(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }
            const { role, isActive, search } = req.query;
            const users = await auth_service_1.AuthService.getAllUsers(adminId, {
                role: role,
                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                search: search
            });
            res.json({ success: true, data: users });
        }
        catch (error) {
            if (error.message === "ADMIN_ACCESS_REQUIRED") {
                return res.status(403).json({ success: false, message: "Admin access required" });
            }
            console.error("Get all users error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Promote to Admin
    static async promoteToAdmin(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }
            const { userId } = req.params;
            const result = await auth_service_1.AuthService.promoteToAdmin(adminId, parseInt(userId));
            res.json(result);
        }
        catch (error) {
            if (error.message === "ADMIN_ACCESS_REQUIRED") {
                return res.status(403).json({ success: false, message: "Admin access required" });
            }
            if (error.message === "USER_NOT_FOUND") {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            if (error.message === "USER_ALREADY_ADMIN") {
                return res.status(400).json({ success: false, message: "User is already an admin" });
            }
            console.error("Promote to admin error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Demote from Admin
    static async demoteFromAdmin(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }
            const { userId } = req.params;
            const result = await auth_service_1.AuthService.demoteFromAdmin(adminId, parseInt(userId));
            res.json(result);
        }
        catch (error) {
            if (error.message === "ADMIN_ACCESS_REQUIRED") {
                return res.status(403).json({ success: false, message: "Admin access required" });
            }
            if (error.message === "USER_NOT_FOUND") {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            if (error.message === "USER_NOT_ADMIN") {
                return res.status(400).json({ success: false, message: "User is not an admin" });
            }
            if (error.message === "CANNOT_DEMOTE_SELF") {
                return res.status(400).json({ success: false, message: "You cannot demote yourself" });
            }
            if (error.message === "CANNOT_DEMOTE_LAST_ADMIN") {
                return res.status(400).json({ success: false, message: "Cannot demote the last admin" });
            }
            console.error("Demote from admin error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Change User Role
    static async changeUserRole(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }
            const { userId } = req.params;
            const { role } = req.body;
            if (!role || !["ADMIN", "FARMER", "BUYER"].includes(role)) {
                return res.status(400).json({ success: false, message: "Invalid role" });
            }
            const result = await auth_service_1.AuthService.changeUserRole(adminId, parseInt(userId), role);
            res.json(result);
        }
        catch (error) {
            if (error.message === "ADMIN_ACCESS_REQUIRED") {
                return res.status(403).json({ success: false, message: "Admin access required" });
            }
            if (error.message === "USER_NOT_FOUND") {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            if (error.message === "CANNOT_CHANGE_LAST_ADMIN_ROLE") {
                return res.status(400).json({ success: false, message: "Cannot change the last admin's role" });
            }
            console.error("Change user role error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Suspend User
    static async suspendUser(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }
            const { userId } = req.params;
            const result = await auth_service_1.AuthService.suspendUser(adminId, parseInt(userId));
            res.json(result);
        }
        catch (error) {
            if (error.message === "ADMIN_ACCESS_REQUIRED") {
                return res.status(403).json({ success: false, message: "Admin access required" });
            }
            if (error.message === "CANNOT_SUSPEND_SELF") {
                return res.status(400).json({ success: false, message: "You cannot suspend yourself" });
            }
            if (error.message === "USER_NOT_FOUND") {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            console.error("Suspend user error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Unsuspend User
    static async unsuspendUser(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }
            const { userId } = req.params;
            const result = await auth_service_1.AuthService.unsuspendUser(adminId, parseInt(userId));
            res.json(result);
        }
        catch (error) {
            if (error.message === "ADMIN_ACCESS_REQUIRED") {
                return res.status(403).json({ success: false, message: "Admin access required" });
            }
            if (error.message === "USER_NOT_FOUND") {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            console.error("Unsuspend user error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AuthController = AuthController;
