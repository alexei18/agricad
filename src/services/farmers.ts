
'use server';

import prisma from '@/lib/prisma';
import type { Farmer as PrismaFarmer } from '@prisma/client';
import { LogType } from '@prisma/client';
import { addLogEntry } from './logs';
import bcrypt from 'bcrypt'; // Import bcrypt

// Define a list of default colors to cycle through
const DEFAULT_COLORS = [
  'hsl(217, 91%, 60%)', // Blue
  'hsl(122, 39%, 49%)', // Green
  'hsl(40, 90%, 60%)',  // Yellowish
  'hsl(0, 70%, 65%)',   // Reddish
  'hsl(260, 60%, 60%)', // Purplish
  'hsl(180, 50%, 50%)', // Teal
  'hsl(30, 90%, 55%)',  // Orange
  'hsl(320, 70%, 60%)', // Pink
];

// Helper function to get the next default color based on existing farmer count
async function getNextDefaultColor(): Promise<string> {
  try {
    const farmerCount = await prisma.farmer.count();
    return DEFAULT_COLORS[farmerCount % DEFAULT_COLORS.length];
  } catch (error) {
    console.error('[FarmerService] Error counting farmers for default color:', error);
    return DEFAULT_COLORS[0]; // Fallback to the first color
  }
}


export type Farmer = PrismaFarmer;

// Hashing cost factor
const SALT_ROUNDS = 10;

export async function getAllFarmers(village?: string): Promise<Farmer[]> {
  console.log(`[FarmerService] Fetching farmers ${village ? `for village: ${village}` : 'for all villages'} from DB`);
  try {
    const farmers = await prisma.farmer.findMany({
      where: village ? { village: village } : {},
      orderBy: {
        name: 'asc',
      },
       // Exclude password hash from default fetch, include color
       select: {
           id: true,
           name: true,
           companyCode: true,
           village: true,
           email: true,
           phone: true,
           color: true, // Include color
           createdAt: true,
           updatedAt: true,
           // Explicitly list fields EXCEPT password
       }
    });
    // Cast result back to Farmer[] - password will be undefined/null
    return farmers as unknown as Farmer[];
  } catch (error) {
    console.error('[FarmerService] Error fetching all farmers:', error);
    throw new Error('Could not load farmer data.');
  }
}

export async function getFarmerById(id: string): Promise<Omit<Farmer, 'password'> | null> { // Exclude password
  console.log(`[FarmerService] Fetching farmer by ID: ${id} from DB`);
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { id: id },
       select: { // Select all except password, include color
           id: true,
           name: true,
           companyCode: true,
           village: true,
           email: true,
           phone: true,
           color: true, // Include color
           createdAt: true,
           updatedAt: true,
       }
    });
    return farmer as Omit<Farmer, 'password'> | null;
  } catch (error) {
    console.error(`[FarmerService] Error fetching farmer ${id}:`, error);
    throw new Error('Could not load farmer data.');
  }
}

// Type for adding farmer, includes password, color is optional
type AddFarmerData = Omit<Farmer, 'id' | 'createdAt' | 'updatedAt' | 'color'> & { color?: string | null };


export async function addFarmer(
    farmerData: AddFarmerData, // Expects password in the input, color is optional
    actorId: string = 'Mayor_Unknown'
): Promise<{ success: boolean; id?: string; error?: string }> {
    console.log(`[FarmerService] Adding new farmer by ${actorId}:`, { ...farmerData, password: '***' }); // Log without password

    // Added password validation
    if (!farmerData.name || !farmerData.companyCode || !farmerData.village || !farmerData.password) {
        await addLogEntry(LogType.USER_ACTION, actorId, 'Failed Add Farmer', `Error: Missing required fields (name, companyCode, village, password).`);
        return { success: false, error: "Missing required fields (name, companyCode, village, password)." };
    }
    if (farmerData.password.length < 8) {
        await addLogEntry(LogType.USER_ACTION, actorId, 'Failed Add Farmer', `Error: Password too short.`);
        return { success: false, error: "Password must be at least 8 characters long." };
    }

    try {
        const existingByCode = await prisma.farmer.findUnique({
            where: { companyCode: farmerData.companyCode },
        });
        if (existingByCode) {
             await addLogEntry(LogType.USER_ACTION, actorId, 'Failed Add Farmer', `Error: Company code ${farmerData.companyCode} already exists.`);
            return { success: false, error: `Farmer with company code ${farmerData.companyCode} already exists.` };
        }
        if (farmerData.email) {
             const existingByEmail = await prisma.farmer.findUnique({
                 where: { email: farmerData.email },
             });
             if (existingByEmail) {
                  await addLogEntry(LogType.USER_ACTION, actorId, 'Failed Add Farmer', `Error: Email ${farmerData.email} already exists.`);
                 return { success: false, error: `Farmer with email ${farmerData.email} already exists.` };
             }
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(farmerData.password, SALT_ROUNDS);

        // Assign default color if not provided
        const farmerColor = farmerData.color || await getNextDefaultColor();


        const newFarmer = await prisma.farmer.create({
            data: {
                name: farmerData.name,
                companyCode: farmerData.companyCode,
                village: farmerData.village,
                email: farmerData.email || null,
                phone: farmerData.phone || null,
                password: hashedPassword, // Save the hashed password
                color: farmerColor, // Save the assigned color
            },
        });

        await addLogEntry(LogType.USER_ACTION, actorId, 'Added Farmer', `ID: ${newFarmer.id}, Name: ${newFarmer.name}, Village: ${newFarmer.village}, Color: ${farmerColor}`);
        console.log(`[FarmerService] Farmer added with ID: ${newFarmer.id}`);
        return { success: true, id: newFarmer.id };
    } catch (error) {
        console.error('[FarmerService] Error adding farmer:', error);
         await addLogEntry(LogType.USER_ACTION, actorId, 'Failed Add Farmer', `Database Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return { success: false, error: `Database error: ${error instanceof Error ? error.message : 'Could not add farmer.'}` };
    }
}

// Type for updating farmer, EXCLUDE password, includes color
type UpdateFarmerData = Partial<Omit<Farmer, 'id' | 'createdAt' | 'password'>>;

export async function updateFarmer(
    id: string,
    farmerData: UpdateFarmerData, // Does not include password, can include color
    actorId: string = 'Mayor_Unknown'
): Promise<{ success: boolean; error?: string }> {
    console.log(`[FarmerService] Updating farmer ${id} by ${actorId}:`, farmerData);

    try {
        const farmer = await prisma.farmer.findUnique({ where: { id } });
        if (!farmer) {
            await addLogEntry(LogType.USER_ACTION, actorId, 'Failed Update Farmer', `Error: Farmer ID ${id} not found.`);
            return { success: false, error: `Farmer with ID ${id} not found.` };
        }

        // Ensure password is not accidentally updated here
        delete (farmerData as any).password;

        // Handle empty email/phone being set to null
        if (farmerData.email === '') farmerData.email = null;
        if (farmerData.phone === '') farmerData.phone = null;
        if (farmerData.color === '') farmerData.color = null; // Allow clearing color

        const updatedFarmer = await prisma.farmer.update({
            where: { id: id },
            data: farmerData, // Pass the update data directly
        });

        const changes = Object.keys(farmerData)
            // Use 'any' for dynamic key access, or define a more specific type
            .filter(key => key !== 'createdAt' && key !== 'updatedAt') // Filter out timestamps
            .map(key => `${key}: '${(farmer as any)[key]}' -> '${(updatedFarmer as any)[key]}'`)
            .join(', ');
        await addLogEntry(LogType.USER_ACTION, actorId, 'Updated Farmer', `ID: ${id}, Changes: ${changes || 'None'}`);
        console.log(`[FarmerService] Farmer ${id} updated successfully.`);
        return { success: true };

    } catch (error) {
        console.error(`[FarmerService] Error updating farmer ${id}:`, error);
         await addLogEntry(LogType.USER_ACTION, actorId, 'Failed Update Farmer', `ID: ${id}, Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return { success: false, error: `Database error: ${error instanceof Error ? error.message : 'Could not update farmer.'}` };
    }
}

export async function deleteFarmer(
    id: string,
    actorId: string = 'Mayor_Unknown'
): Promise<{ success: boolean; error?: string }> {
    console.log(`[FarmerService] Deleting farmer ${id} by ${actorId}`);
    try {
        const farmer = await prisma.farmer.findUnique({ where: { id } });
        if (!farmer) {
            await addLogEntry(LogType.USER_ACTION, actorId, 'Failed Delete Farmer', `Error: Farmer ID ${id} not found.`);
            return { success: false, error: `Farmer with ID ${id} not found.` };
        }

        // Before deleting farmer, ensure relations are handled (e.g., parcels set to null)
        // Prisma's onDelete: SetNull should handle this if configured in schema.prisma
        // Manual update if needed:
        await prisma.parcel.updateMany({ where: { ownerId: id }, data: { ownerId: null } });
        await prisma.parcel.updateMany({ where: { cultivatorId: id }, data: { cultivatorId: null } });

        await prisma.farmer.delete({
            where: { id: id },
        });

        await addLogEntry(LogType.USER_ACTION, actorId, 'Deleted Farmer', `ID: ${id}, Name: ${farmer.name}, Village: ${farmer.village}`);
        console.log(`[FarmerService] Farmer ${id} deleted successfully.`);
        return { success: true };
    } catch (error) {
        console.error(`[FarmerService] Error deleting farmer ${id}:`, error);
         await addLogEntry(LogType.USER_ACTION, actorId, 'Failed Delete Farmer', `ID: ${id}, Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return { success: false, error: `Database error: ${error instanceof Error ? error.message : 'Could not delete farmer.'}` };
    }
}

// TODO: Add function for password reset if needed
// export async function resetFarmerPassword(...) { ... }
