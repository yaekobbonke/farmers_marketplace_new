import prisma from "../../config/prisma";
import { hashPassword, comparePassword } from "../../utils/bcrypt";
import { RegisterInput, LoginInput } from "./auth.types";
import { signToken } from "../../utils/jwt";

export class AuthService {
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
          role: input.role || "BUYER",
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

  static async login(input: LoginInput): Promise<{ token: string; user: any }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,      // ✅ Added
        password: true,
        role: true,
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

    // ✅ Fixed: Use { id, email, role } to match TokenPayload
    const token = signToken({ 
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
}