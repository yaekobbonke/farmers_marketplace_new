"use strict";
// backend/src/utils/jwt.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "jackman@Bonke";
function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
// ✅ Fixed: Return null instead of throwing errors
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            console.log("Token has expired");
            return null;
        }
        if (error.name === "JsonWebTokenError") {
            console.log("Invalid token");
            return null;
        }
        console.log("Token verification error:", error.message);
        return null;
    }
}
