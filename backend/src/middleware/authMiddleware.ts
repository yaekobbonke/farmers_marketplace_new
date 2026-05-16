import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt" 

export const isAdmin = (req: any, res: any, next: any) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }
        
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Admin access required"
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

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
    if (!auth || !auth.startsWith("Bearer")) {
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
        res.status(401).json({ message: "Invalid token" });
    }
};

export const requireRole = (...roles: JwtPayload["role"][]) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
