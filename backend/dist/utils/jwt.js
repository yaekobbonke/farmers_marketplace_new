"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "jackman@Bonke";
function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new Error("Token has expired");
        }
        if (error.name === "JsonWebTokenError") {
            throw new Error("Invalid token");
        }
        throw error;
    }
}
