import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CategoryService {
  async getAllCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    });
  }

  async getCategoryById(id: string) {
    return prisma.category.findUnique({
      where: { id }
    });
  }

  async getCategoryBySlug(slug: string) {
    return prisma.category.findFirst({
      where: { 
        slug: slug,
        isActive: true 
      }
    });
  }

  async createCategory(data: { 
    name: string; 
    slug?: string; 
    description?: string;
    image?: string;
  }) {
    const slug = data.slug || data.name.toLowerCase().replace(/ /g, "-");
    
    return prisma.category.create({
      data: {
        name: data.name,
        slug: slug,
        description: data.description,
        image: data.image,
        isActive: true
      }
    });
  }

  async updateCategory(id: string, data: { 
    name?: string; 
    slug?: string; 
    description?: string;
    image?: string;
    isActive?: boolean;
  }) {
    return prisma.category.update({
      where: { id },
      data
    });
  }

  async deleteCategory(id: string) {
    return prisma.category.update({
      where: { id },
      data: { isActive: false }
    });
  }
}