"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(err, req, res, next) {
    console.error("[Backend Error]:", err.message || err);
    // Check if it's a Zod Error
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            success: false,
            message: err.issues?.[0]?.message || "Validation failed",
            details: err.issues // Use 'issues' instead of 'errors'
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
