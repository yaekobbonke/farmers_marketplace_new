// backend/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt";

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

        // ✅ Map to JwtPayload format
        req.user = {
            id: decoded.id,
            role: decoded.role as "FARMER" | "BUYER" | "ADMIN"
        };
        
        console.log("User authenticated with role:", req.user.role);
        next();
    } catch (err: any) {
        console.error("Auth error:", err.message);
        res.status(401).json({ success: false, message: "Invalid token" });
    }
};

export const requireRole = (...roles: JwtPayload["role"][]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            console.log("No user in request");
            return res.status(401).json({ 
                success: false, 
                message: "Authentication required" 
            });
        }
        
        // ✅ Case-insensitive comparison
        const userRole = req.user.role?.toUpperCase();
        const allowedRoles = roles.map(r => r.toUpperCase());
        
        console.log(`Role check - User: ${req.user.role}, Allowed: ${allowedRoles}`);
        
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

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }
        
        if (req.user.role?.toUpperCase() !== "ADMIN") {
            console.log(`Admin check failed: User role is ${req.user.role}`);
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
};