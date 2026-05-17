import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export interface JwtPayload {
    id: number;
    email: string;
    role: "FARMER" | "BUYER" | "ADMIN";
    is_suspended?: boolean;
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
        console.log("No Bearer token found");
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const token = auth.split(" ")[1];
        const decoded = verifyToken(token);
        
        console.log("Decoded token:", decoded);
        
        if (!decoded) {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role as "FARMER" | "BUYER" | "ADMIN",
            is_suspended: decoded.is_suspended
        };
        
        console.log("User authenticated:", req.user.id, "Role:", req.user.role);
        next();
    } catch (err: any) {
        console.error("Auth error:", err.message);
        res.status(401).json({ success: false, message: "Invalid token" });
    }
};

export const requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            console.log("No user in request");
            return res.status(401).json({ 
                success: false, 
                message: "Authentication required" 
            });
        }
        
        const userRole = req.user.role?.toUpperCase();
        const allowedRoles = roles.map(r => r.toUpperCase());
        
        console.log(`Role check - User role: ${req.user.role} (${userRole}), Allowed: ${allowedRoles}`);
        
        if (!allowedRoles.includes(userRole)) {
            console.log(`Access denied: ${userRole} not in ${allowedRoles}`);
            return res.status(403).json({ 
                success: false, 
                message: "Forbidden: Admin privileges required" 
            });
        }
        
        next();
    };
};