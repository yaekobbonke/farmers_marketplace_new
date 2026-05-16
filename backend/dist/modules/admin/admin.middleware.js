"use strict";
// import { Request, Response, NextFunction } from "express";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    }
    else {
        res.status(403).json({
            success: false,
            message: "Access Denied: Admin privileges required",
        });
    }
};
exports.isAdmin = isAdmin;
