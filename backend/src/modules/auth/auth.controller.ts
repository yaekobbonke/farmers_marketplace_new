import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { registerSchema, loginSchema } from "./auth.schema";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    console.log("🔥 BODY RECEIVED:", req.body)
    try {
      const data = registerSchema.parse(req.body);
      const { userId } = await AuthService.register(data);

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: { userId },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);

      // DESTUCTURE BOTH: token and user (which includes the role)
      const { token, user } = await AuthService.login(data);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user, // Now frontend knows: user.role === 'FARMER'
        },
      });
    } catch (err) {
      next(err);
    }
  }
}