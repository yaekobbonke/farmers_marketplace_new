import prisma from "../../config/prisma";
import { hashPassword, comparePassword } from "../../utils/bcrypt";
import { RegisterInput, LoginInput } from "./auth.types";
import { signToken } from "../../utils/jwt";

export class AuthService {
  /**
   * Registers a new user.
   * Now includes the 'role' field (FARMER, BUYER, or ADMIN).
   */
  static async register(input: RegisterInput): Promise<{ userId: number }> {
    const hashed = await hashPassword(input.password);

    try {
      const user = await prisma.user.create({
        data: {
          first_name: input.first_name,
          last_name: input.last_name,
          location: input.location,
          email: input.email.toLowerCase().trim(),
          phone: input.phone,
          password: hashed,
          role: input.role || "BUYER", // Default to Buyer if not specified
        },
        select: {
          id: true,
        },
      });
      return { userId: user.id };
       
    } catch (error: any) {
      // Prisma error code for Unique constraint violation (e.g., email already exists)
      if (error.code === "P2002") {
        throw new Error("USER_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  /**
   * Validates credentials and generates a JWT.
   * Includes the role in the token payload so middleware can check permissions.
   */
  static async login(input: LoginInput): Promise<{ token: string; user: any }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      select: {
        id: true,
        password: true,
        role: true, // 👈 Needed for the JWT payload and frontend logic
        first_name: true,
        last_name: true,
      },
    });

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }
  
    const valid = await comparePassword(input.password, user.password);

    if (!valid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Include userId and role in the token for the requireRole middleware
    const token = signToken({ userId: user.id, role: user.role });

    // Return the token and basic user info for the Frontend State (Zustand/Redux)
    return { 
      token, 
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role
      }
    };
  }
}