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

// ✅ Fixed: Return null instead of throwing errors
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as TokenPayload;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      console.log("Token has expired");
      return null;
    }
    if (error.name === "JsonWebTokenError") {
      console.log("Invalid token");
      return null;
    }
    console.log("Token verification error:", error.message);
    return null;
  }
}