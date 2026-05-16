import prisma from "../../config/prisma";

export class CategoryService {
  async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { name: "asc" }
    });
  }

  async getCategoryById(id: number) {
    return prisma.category.findUnique({
      where: { id }
    });
  }

  async createCategory(data: { name: string }) {
    return prisma.category.create({
      data: {
        name: data.name
      }
    });
  }

  async updateCategory(id: number, data: { name?: string }) {
    return prisma.category.update({
      where: { id },
      data
    });
  }

  async deleteCategory(id: number) {
    return prisma.category.delete({
      where: { id }
    });
  }
}