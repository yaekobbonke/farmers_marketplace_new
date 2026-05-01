"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json()); // This reads the stream and populates req.body
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    if (req.method === "POST") {
        console.log(`📦 [${req.method}] ${req.path} - Body:`, req.body);
    }
    next();
});
app.use("/api", routes_1.default);
app.get("/", (req, res) => {
    res.send("Farmers Marketplace API is running...");
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
