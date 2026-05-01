const jwt = require('jsonwebtoken');

const JWT_SECRET: string = process.env.JWT_SECRET || "jackman@Bonke";

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
  is_suspended?: boolean;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as TokenPayload;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    throw error;
  }
}