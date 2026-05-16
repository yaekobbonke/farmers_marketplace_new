import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  // ✅ Register
  static async register(req: Request, res: Response) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === "USER_ALREADY_EXISTS") {
        return res.status(409).json({ success: false, message: "User already exists" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Login
  static async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Get Profile
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const profile = await AuthService.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Update Profile
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const { first_name, last_name, phone, location } = req.body;
      const updated = await AuthService.updateProfile(userId, {
        first_name,
        last_name,
        phone,
        location
      });

      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Change Password
  static async changePassword(req: Request, res: Response) {
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

      await AuthService.changePassword(userId, currentPassword, newPassword);
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error: any) {
      if (error.message === "INVALID_CURRENT_PASSWORD") {
        return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Delete Account
  static async deleteAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ success: false, message: "Password is required to delete account" });
      }

      await AuthService.deleteAccount(userId, password);
      res.json({ success: true, message: "Account deleted successfully", shouldLogout: true });
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if (error.message === "INVALID_PASSWORD") {
        return res.status(401).json({ success: false, message: "Incorrect password" });
      }
      if (error.message === "CANNOT_DELETE_LAST_ADMIN") {
        return res.status(403).json({ success: false, message: "Cannot delete the last admin account" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Deactivate Account
  static async deactivateAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ success: false, message: "Password is required to deactivate account" });
      }

      await AuthService.deactivateAccount(userId, password);
      res.json({ success: true, message: "Account deactivated successfully", shouldLogout: true });
    } catch (error: any) {
      if (error.message === "INVALID_PASSWORD") {
        return res.status(401).json({ success: false, message: "Incorrect password" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Get All Users (Admin only)
  static async getAllUsers(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const { role, isActive, search } = req.query;
      const users = await AuthService.getAllUsers(adminId, {
        role: role as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string
      });

      res.json({ success: true, data: users });
    } catch (error: any) {
      if (error.message === "ADMIN_ACCESS_REQUIRED") {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Promote to Admin
  static async promoteToAdmin(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const { userId } = req.params;
      const result = await AuthService.promoteToAdmin(adminId, parseInt(userId));
      res.json(result);
    } catch (error: any) {
      if (error.message === "ADMIN_ACCESS_REQUIRED") {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if (error.message === "USER_ALREADY_ADMIN") {
        return res.status(400).json({ success: false, message: "User is already an admin" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Demote from Admin
  static async demoteFromAdmin(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const { userId } = req.params;
      const result = await AuthService.demoteFromAdmin(adminId, parseInt(userId));
      res.json(result);
    } catch (error: any) {
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
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Change User Role
  static async changeUserRole(req: Request, res: Response) {
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

      const result = await AuthService.changeUserRole(adminId, parseInt(userId), role);
      res.json(result);
    } catch (error: any) {
      if (error.message === "ADMIN_ACCESS_REQUIRED") {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if (error.message === "CANNOT_CHANGE_LAST_ADMIN_ROLE") {
        return res.status(400).json({ success: false, message: "Cannot change the last admin's role" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Suspend User
  static async suspendUser(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const { userId } = req.params;
      const result = await AuthService.suspendUser(adminId, parseInt(userId));
      res.json(result);
    } catch (error: any) {
      if (error.message === "ADMIN_ACCESS_REQUIRED") {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
      if (error.message === "CANNOT_SUSPEND_SELF") {
        return res.status(400).json({ success: false, message: "You cannot suspend yourself" });
      }
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Unsuspend User
  static async unsuspendUser(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const { userId } = req.params;
      const result = await AuthService.unsuspendUser(adminId, parseInt(userId));
      res.json(result);
    } catch (error: any) {
      if (error.message === "ADMIN_ACCESS_REQUIRED") {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
}