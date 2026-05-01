import prisma from "../../config/prisma";

export class AdminService {
  static async getSystemStats() {
    const [userCount, productCount, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      userCount,
      productCount,
      revenue: totalRevenue._sum?.totalAmount || 0,
    };
  }

  static async getPendingProducts() {
    const products = await prisma.product.findMany({
      where: { is_verified: false },
      include: { 
        farmer: {
          select: { 
            first_name: true,
            last_name: true,
            email: true 
          } 
        } 
      },
      orderBy: { createdAt: "desc" },
    });

    // Add a fullName field for convenience
    return products.map(product => ({
      ...product,
      farmer: product.farmer ? {
        ...product.farmer,
        fullName: `${product.farmer.first_name} ${product.farmer.last_name}`
      } : null
    }));
  }

  static async verifyProduct(id: number) {
    return prisma.product.update({
      where: { id },
      data: { is_verified: true },
    });
  }

  static async toggleUserStatus(id: number, isSuspended: boolean) {
    return prisma.user.update({
      where: { id },
      data: { is_suspended: isSuspended },
    });
  }

  static async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        is_suspended: true,
        createdAt: true,
        _count: {
          select: { products: true, orders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add a fullName field for each user
    return users.map(user => ({
      ...user,
      fullName: `${user.first_name} ${user.last_name}`
    }));
  }
}