import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error("[Backend Error]:", err.message || err);

    // Check if it's a Zod Error
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: err.issues?.[0]?.message || "Validation failed",
            details: err.issues  // Use 'issues' instead of 'errors'
        });
    }

    // Prisma unique constraint error
    if (err.code === "P2002") {
        return res.status(409).json({
            success: false,
            message: "A record with this unique field already exists."
        });
    }

    // Default error response
    const status = err.status || 500;
    return res.status(status).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
}