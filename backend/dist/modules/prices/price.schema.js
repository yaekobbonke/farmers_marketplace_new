"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketPriceSchema = exports.recordPriceSchema = void 0;
const zod_1 = require("zod");
exports.recordPriceSchema = zod_1.z.object({
    productId: zod_1.z.number().int().positive(),
    price: zod_1.z.number().positive(),
    unit: zod_1.z.string().default("kg"),
    market: zod_1.z.string().min(2),
});
exports.marketPriceSchema = zod_1.z.object({
    crop: zod_1.z.string().min(2),
    productId: zod_1.z.number().int().positive(),
    market: zod_1.z.string().min(2),
    price: zod_1.z.number().positive(),
    unit: zod_1.z.string().default("kg"),
    source: zod_1.z.string().default("manual"),
});
