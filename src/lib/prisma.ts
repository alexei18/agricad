
import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the Prisma Client instance
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Initialize Prisma Client
// Use the global instance in development to avoid creating too many connections
// Create a new instance in production
export const prisma = global.prisma || new PrismaClient({
    // Optional: Log database queries during development
    // log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Assign the Prisma Client instance to the global variable in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export the Prisma Client instance for use in services
export default prisma;
