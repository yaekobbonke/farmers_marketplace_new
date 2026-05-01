"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const jwt_1 = require("../../utils/jwt");
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
        next({ status: 401, message: "Invalid token" });
    }
};
exports.authenticate = authenticate;
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return next({ status: 403, message: "Forbidden" });
    }
    next();
};
exports.requireRole = requireRole;
