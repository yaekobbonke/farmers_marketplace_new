import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: "FARMER" | "BUYER" | "ADMIN";
        is_suspended?: boolean;
      };
    }
  }
}


export {};