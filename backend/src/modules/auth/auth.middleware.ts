import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../utils/jwt";

export interface JwtPayload {
    id: number;
    role: "FARMER" | "BUYER" | "ADMIN";
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const token = auth.split(" ")[1];
        const decode = verifyToken(token) as JwtPayload;

        if (!decode) {
            return res.status(401).json({ message: "Invalid token" });
        }

        req.user = decode;
        next();
    } catch (err: any) {
        next({status: 401, message: "Invalid token"});
    }
};

export const requireRole = (...roles: JwtPayload["role"][]) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next({status: 403, message: "Forbidden"});
        }
        next();
    };