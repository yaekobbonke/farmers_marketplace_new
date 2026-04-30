import prisma from "../../config/prisma";

export class AdminService {
  /**
   * Fetches global system analytics.
   * Runs counts in parallel for optimal performance.
   */
  static async getSystemStats() {
    const [userCount, productCount, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },  // ✅ Changed from 'totalPrice' to 'totalAmount'
      }),
    ]);

    return {
      userCount,
      productCount,
      revenue: totalRevenue._sum.totalAmount || 0,  // ✅ Also update this reference
    };
  }

  /**
   * Retrieves all products awaiting admin approval.
   * Includes farmer details to help the admin verify the source.
   */
  static async getPendingProducts() {
    return prisma.product.findMany({
      where: { is_verified: false },
      include: { 
        farmer: {
          select: { name: true, email: true } 
        } 
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Verifies a product listing.
   * This allows the product to be highlighted in the marketplace.
   */
  static async verifyProduct(id: number) {
    return prisma.product.update({
      where: { id },
      data: { is_verified: true },
    });
  }

  /**
   * Suspends or reinstates a user account.
   * Useful for handling traders or farmers who violate platform rules.
   */
  static async toggleUserStatus(id: number, isSuspended: boolean) {
    return prisma.user.update({
      where: { id },
      data: { is_suspended: isSuspended },
    });
  }

  static async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_suspended: true,
        createdAt: true,
        _count: {
          select: { products: true, orders: true } // Shows how active they are
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}