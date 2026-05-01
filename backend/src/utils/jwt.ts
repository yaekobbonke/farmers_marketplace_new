import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET || "jackman@Bonke";

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
  is_suspended?: boolean;
}

const signOptions: SignOptions = {
  expiresIn: "7d",
  algorithm: "HS256"
};

const verifyOptions: VerifyOptions = {
  algorithms: ["HS256"]
};

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, verifyOptions);
    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw error;
  }
}