import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error("❌ [Backend Error]:", err.message || err);

    // Check if it's a Zod Error AND has the errors array
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: err.errors?.[0]?.message || "Validation failed", // Added optional chaining ?.
            details: err.errors
        });
    }

    // Prisma error check
    if (err.code === "P2002") {
        return res.status(409).json({
            success: false,
            message: "User with this email already exists."
        });
    }

    const status = err.status || 500;
    return res.status(status).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
}