"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
class ProductService {
    /**
     * Creates a new product.
     * Ensure 'name' matches common market names (e.g., "White Teff")
     * so the scraper can map it correctly later.
     */
    static create(farmerId, data) {
        return prisma_1.default.product.create({
            data: {
                ...data,
                farmerId,
                status: "AVAILABLE" // Default status
            }
        });
    }
    /**
     * Fetches products with Category, Farmer, and the
     * most recent AI Prediction and Market Price.
     */
    static getAll(query) {
        return prisma_1.default.product.findMany({
            where: {
                status: "AVAILABLE",
                // Match the query parameters to your schema fields
                categoryId: query.categoryId ? parseInt(query.categoryId) : undefined,
                name: query.name ? { contains: query.name, mode: 'insensitive' } : undefined,
            },
            include: {
                category: true,
                farmer: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        location: true,
                    }
                },
                // Using the exact relation names from your schema:
                pricePredictions: {
                    orderBy: {
                        createdAt: "desc"
                    },
                    take: 1
                },
                priceHistories: {
                    orderBy: {
                        createdAt: "desc" // Use createdAt or recordedAt based on PriceHistory model
                    },
                    take: 1
                },
                marketPrice: {
                    orderBy: {
                        createdAt: "desc"
                    },
                    take: 1
                }
            }
        });
    }
    /**
     * Gets a specific product detail.
     * Essential for the Product Detail Page where the AI chart will live.
     */
    static getById(id) {
        return prisma_1.default.product.findUnique({
            where: { id },
            include: {
                category: true,
                farmer: true,
                // Include history so the frontend can plot a price chart
                marketPrice: {
                    orderBy: { recordedAt: 'desc' },
                    take: 10
                },
                pricePredictions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
    }
    static async update(id, farmerId, data) {
        const product = await prisma_1.default.product.findUnique({
            where: { id }
        });
        if (!product || product.farmerId !== farmerId) {
            throw new Error("Unauthorized: You do not own this product listing.");
        }
        return prisma_1.default.product.update({
            where: { id },
            data
        });
    }
    static async remove(id, farmerId) {
        const product = await prisma_1.default.product.findUnique({ where: { id } });
        if (!product || product.farmerId !== farmerId) {
            throw new Error("Unauthorized");
        }
        // Instead of a hard delete, consider a soft delete (status: "DELETED")
        // but for now, we'll keep your hard delete logic.
        return prisma_1.default.product.delete({ where: { id } });
    }
}
exports.ProductService = ProductService;
