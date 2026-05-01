"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
// ✅ Safe import with fallback for missing types
const bcrypt_1 = __importDefault(require("bcrypt"));
async function hashPassword(password) {
    if (!password) {
        throw new Error("Password is required");
    }
    const saltRounds = 10;
    return await bcrypt_1.default.hash(password, saltRounds);
}
async function comparePassword(password, hash) {
    if (!password || !hash) {
        return false;
    }
    return await bcrypt_1.default.compare(password, hash);
}
