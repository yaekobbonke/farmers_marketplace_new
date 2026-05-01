"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(["CROP", "LIVESTOCK"]),
    quantity: zod_1.z.number().positive(),
    unit: zod_1.z.string().min(2),
    price: zod_1.z.number().positive(),
    status: zod_1.z.enum(["AVAILABLE", "SOLD_OUT"]).default("AVAILABLE"),
    tags: zod_1.z.string().optional(),
    embeddingId: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional()
});
exports.updateProductSchema = exports.createProductSchema.partial();
