"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const isAdmin = (req, res, next) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.isAdmin = isAdmin;
