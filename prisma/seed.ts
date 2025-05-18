// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log(`Start seeding ...`);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file for seeding.');
    process.exit(1); // Exit if essential variables are missing
  }

  // Check if an Admin model exists - if not, we skip seeding admin directly
  // For now, we assume no separate Admin model and these credentials are conceptual
  // or would be used if an Admin model was added.
  // If you add an Admin model, uncomment and adapt the below:

  /*
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    console.log(`Creating default admin user: ${adminEmail}`);
    const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    await prisma.admin.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        // Add other required fields if your Admin model has them
      },
    });
    console.log(`Admin user ${adminEmail} created.`);
  } else {
    console.log(`Admin user ${adminEmail} already exists.`);
  }
  */

  // --- Seed Example Mayor and Farmer for Testing (Optional) ---
  // You can uncomment and adapt this if you need initial data for testing mayor/farmer flows

  const mayorVillage = 'Baraboi'; // Example village
  const mayorEmail = 'mayor.baraboi@example.com';
  const mayorPassword = 'password123';

  let mayor = await prisma.mayor.findUnique({ where: { village: mayorVillage } });
  if (!mayor) {
    console.log(`Creating example mayor for village: ${mayorVillage}`);
    const hashedMayorPassword = await bcrypt.hash(mayorPassword, SALT_ROUNDS);
    mayor = await prisma.mayor.create({
      data: {
        id: 'mayor1', // Hardcoded ID used in the app
        name: 'Primar Baraboi',
        village: mayorVillage,
        email: mayorEmail,
        password: hashedMayorPassword,
        subscriptionStatus: 'ACTIVE', // Make active for testing
        subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
      },
    });
    console.log(`Mayor for ${mayorVillage} created with ID: ${mayor.id}`);
  } else {
    console.log(`Mayor for ${mayorVillage} already exists.`);
  }

  const farmerEmail = 'farmer.ion@example.com';
  const farmerCompanyCode = 'FARMER123';
  const farmerPassword = 'password123';

  let farmer = await prisma.farmer.findUnique({ where: { companyCode: farmerCompanyCode } });
  if (!farmer) {
    console.log(`Creating example farmer: Ion Agricola`);
    const hashedFarmerPassword = await bcrypt.hash(farmerPassword, SALT_ROUNDS);
    farmer = await prisma.farmer.create({
      data: {
        id: 'farmer1', // Hardcoded ID used in the app
        name: 'Ion Agricola',
        companyCode: farmerCompanyCode,
        village: mayorVillage, // Assign to the same village
        email: farmerEmail,
        password: hashedFarmerPassword,
        phone: '0123456789',
      },
    });
    console.log(`Farmer ${farmer.name} created with ID: ${farmer.id}`);
  } else {
    console.log(`Farmer with code ${farmerCompanyCode} already exists.`);
  }

  // --- Seed Example Parcels (Optional) ---
  // Add some dummy parcel data if needed for testing map views
  const parcelsToSeed = [
    { id: 'PARCEL001', village: mayorVillage, area: 10.5, coordinates: [[27.91, 47.77], [27.92, 47.77], [27.92, 47.78], [27.91, 47.78], [27.91, 47.77]], ownerId: farmer.id, cultivatorId: farmer.id },
    { id: 'PARCEL002', village: mayorVillage, area: 5.2, coordinates: [[27.93, 47.76], [27.94, 47.76], [27.94, 47.77], [27.93, 47.77], [27.93, 47.76]], ownerId: null, cultivatorId: farmer.id },
    { id: 'PARCEL003', village: mayorVillage, area: 8.0, coordinates: [[27.90, 47.75], [27.91, 47.75], [27.91, 47.76], [27.90, 47.76], [27.90, 47.75]], ownerId: farmer.id, cultivatorId: null },
     { id: 'PARCEL004', village: 'AnotherVillage', area: 12.0, coordinates: [[28.00, 47.80], [28.01, 47.80], [28.01, 47.81], [28.00, 47.81], [28.00, 47.80]], ownerId: null, cultivatorId: null }, // Parcel in a different village
  ];

   console.log('Seeding example parcels...');
   for (const p of parcelsToSeed) {
       try {
           await prisma.parcel.upsert({
               where: { id: p.id },
               update: { ...p, coordinates: p.coordinates as any }, // Prisma expects Json
               create: { ...p, coordinates: p.coordinates as any }, // Prisma expects Json
           });
           console.log(`Upserted parcel ${p.id}`);
       } catch (parcelError) {
           console.error(`Failed to upsert parcel ${p.id}:`, parcelError);
       }
   }
   console.log('Parcel seeding finished.');


  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
