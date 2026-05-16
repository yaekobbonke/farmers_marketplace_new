"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = exports.isAdmin = void 0;
const jwt_1 = require("../utils/jwt");
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
const authenticate = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const token = auth.split(" ")[1];
        const decode = (0, jwt_1.verifyToken)(token);
        if (!decode) {
            return res.status(401).json({ message: "Invalid token" });
        }
        req.user = decode;
        next();
    }
    catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};
exports.authenticate = authenticate;
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
};
exports.requireRole = requireRole;
