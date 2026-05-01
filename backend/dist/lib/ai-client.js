"use strict";
// import axios from 'axios';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiClient = void 0;
// // In Docker, this will be http://ai-service:8000
// // For local dev, it is http://localhost:8000
// const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
// export const aiClient = axios.create({
//   baseURL: AI_SERVICE_URL,
//   timeout: 10000, // 10 seconds timeout for AI processing
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });
const axios_1 = __importDefault(require("axios"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
exports.aiClient = axios_1.default.create({
    baseURL: 'http://127.0.0.1:8000',
    // Reusing connections prevents "Socket Buffer Full" errors
    httpAgent: new http_1.default.Agent({ keepAlive: true }),
    httpsAgent: new https_1.default.Agent({ keepAlive: true }),
});
