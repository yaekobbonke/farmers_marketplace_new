import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
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