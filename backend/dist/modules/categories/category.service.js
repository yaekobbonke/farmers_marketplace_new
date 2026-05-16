"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
class CategoryService {
    async getAllCategories() {
        return prisma_1.default.category.findMany({
            orderBy: { name: "asc" }
        });
    }
    async getCategoryById(id) {
        return prisma_1.default.category.findUnique({
            where: { id }
        });
    }
    async createCategory(data) {
        return prisma_1.default.category.create({
            data: {
                name: data.name
            }
        });
    }
    async updateCategory(id, data) {
        return prisma_1.default.category.update({
            where: { id },
            data
        });
    }
    async deleteCategory(id) {
        return prisma_1.default.category.delete({
            where: { id }
        });
    }
}
exports.CategoryService = CategoryService;
