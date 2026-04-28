import { PrismaClient, Role, ProductType, ProductStatus } from '@prisma/client';

// Hardcoding the connection string directly into the internal datasource structure
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://Yaekob:5003@localhost:5432/marketplace"
    }
  }
} as any);

async function main() {
  console.log("🚀 Starting seed process (Hardcoded Connection)...");

  // 1. Ensure the System Admin/Farmer exists
  const farmer = await prisma.user.upsert({
    where: { email: "admin@agri.com" },
    update: {},
    create: {
      first_name: "System",
      last_name: "Admin",
      phone: "0911223344",
      email: "admin@agri.com",
      password: "password123", 
      role: Role.ADMIN,
      location: "Addis Ababa",
    },
  });

  console.log(`👤 Admin Farmer ID: ${farmer.id}`);

  // 2. Define the initial crops
  const crops = [
    { name: 'Coffee', unit: 'kg', price: 150.0 },
    { name: 'Teff', unit: 'kg', price: 95.0 },
    { name: 'Maize', unit: 'kg', price: 40.0 },
    { name: 'Wheat', unit: 'kg', price: 60.0 },
    { name: 'Barley', unit: 'kg', price: 45.0 },
  ];

  for (const crop of crops) {
    // Search for existing product by name
    const existing = await prisma.product.findFirst({ where: { name: crop.name } });
    
    if (!existing) {
      await prisma.product.create({
        data: {
          name: crop.name,
          unit: crop.unit,
          price: crop.price,
          quantity: 500,
          type: ProductType.CROP,
          status: ProductStatus.AVAILABLE,
          farmerId: farmer.id,
        },
      });
      console.log(`✅ Product ready: ${crop.name}`);
    } else {
      console.log(`ℹ️ ${crop.name} already exists.`);
    }
  }
}

main()
  .catch((err) => {
    console.error("❌ Seed Error:", err);
    // Use optional chaining or check for process to avoid the global variable error
    if (typeof process !== 'undefined') process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });