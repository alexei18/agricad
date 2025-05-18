
'use server';

import prisma from '@/lib/prisma';
import type { Mayor as PrismaMayor, Status } from '@prisma/client';
import { addLogEntry } from './logs';
import bcrypt from 'bcrypt'; // Import bcrypt

export type Mayor = PrismaMayor;

const SALT_ROUNDS = 10; // Hashing cost factor

export async function getAllMayors(): Promise<Omit<Mayor, 'password'>[]> { // Exclude password
  console.log('[MayorService] Fetching all mayors from DB');
  try {
    const mayors = await prisma.mayor.findMany({
      orderBy: [
        { village: 'asc' },
        { name: 'asc' },
      ],
       select: { // Select all fields except password
           id: true,
           name: true,
           village: true,
           email: true,
           subscriptionStatus: true,
           subscriptionEndDate: true,
           createdAt: true,
           updatedAt: true,
       }
    });
    return mayors as Omit<Mayor, 'password'>[];
  } catch (error) {
    console.error('[MayorService] Error fetching all mayors:', error);
    throw new Error('Could not load mayor data.');
  }
}

export async function getMayorById(id: string): Promise<Omit<Mayor, 'password'> | null> { // Exclude password
  console.log(`[MayorService] Fetching mayor by ID: ${id} from DB`);
  try {
    const mayor = await prisma.mayor.findUnique({
      where: { id: id },
      select: { // Select all fields except password
           id: true,
           name: true,
           village: true,
           email: true,
           subscriptionStatus: true,
           subscriptionEndDate: true,
           createdAt: true,
           updatedAt: true,
       }
    });
    return mayor as Omit<Mayor, 'password'> | null;
  } catch (error) {
    console.error(`[MayorService] Error fetching mayor ${id}:`, error);
    throw new Error('Could not load mayor data.');
  }
}

// Type for adding mayor, includes password
type AddMayorData = Omit<Mayor, 'id' | 'createdAt' | 'updatedAt' | 'subscriptionStatus' | 'subscriptionEndDate'>;

export async function addMayor(
    mayorData: AddMayorData, // Expects password in the input
    actorId: string = 'Admin_Unknown'
): Promise<{ success: boolean; id?: string; error?: string }> {
    console.log(`[MayorService] Adding new mayor by ${actorId}:`, { ...mayorData, password: '***' }); // Log without password

    // Added password validation
    if (!mayorData.name || !mayorData.village || !mayorData.email || !mayorData.password) {
        await addLogEntry('USER_ACTION', actorId, 'Failed Add Mayor', `Error: Missing required fields (name, village, email, password).`);
        return { success: false, error: "Missing required fields (name, village, email, password)." };
    }
     if (mayorData.password.length < 8) {
        await addLogEntry('USER_ACTION', actorId, 'Failed Add Mayor', `Error: Password too short.`);
        return { success: false, error: "Password must be at least 8 characters long." };
    }

    try {
        const existingByEmail = await prisma.mayor.findUnique({ where: { email: mayorData.email } });
        if (existingByEmail) {
            await addLogEntry('USER_ACTION', actorId, 'Failed Add Mayor', `Error: Email ${mayorData.email} exists.`);
            return { success: false, error: `Mayor with email ${mayorData.email} already exists.` };
        }
        const existingByVillage = await prisma.mayor.findUnique({ where: { village: mayorData.village } });
        if (existingByVillage) {
            await addLogEntry('USER_ACTION', actorId, 'Failed Add Mayor', `Error: Village ${mayorData.village} exists.`);
            return { success: false, error: `Mayor for village ${mayorData.village} already exists.` };
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(mayorData.password, SALT_ROUNDS);

        const newMayor = await prisma.mayor.create({
            data: {
                name: mayorData.name,
                village: mayorData.village,
                email: mayorData.email,
                password: hashedPassword, // Save hashed password
                subscriptionStatus: 'PENDING',
                subscriptionEndDate: null,
            },
        });

        await addLogEntry('USER_ACTION', actorId, 'Added Mayor', `ID: ${newMayor.id}, Name: ${newMayor.name}, Village: ${newMayor.village}, Status: PENDING`);
        console.log(`[MayorService] Mayor added with ID: ${newMayor.id}`);
        return { success: true, id: newMayor.id };
    } catch (error) {
        console.error('[MayorService] Error adding mayor:', error);
        await addLogEntry('USER_ACTION', actorId, 'Failed Add Mayor', `Database Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return { success: false, error: `Database error: ${error instanceof Error ? error.message : 'Could not add mayor.'}` };
    }
}

// Type for updating mayor details, EXCLUDE password
type UpdateMayorDetailsData = Partial<Pick<Mayor, 'name' | 'email'>>;

export async function updateMayorDetails(
    id: string,
    mayorData: UpdateMayorDetailsData, // Does not include password
    actorId: string = 'Admin_Unknown'
): Promise<{ success: boolean; error?: string }> {
    console.log(`[MayorService] Updating mayor details for ${id} by ${actorId}:`, mayorData);

    try {
        const mayor = await prisma.mayor.findUnique({ where: { id } });
        if (!mayor) {
            await addLogEntry('USER_ACTION', actorId, 'Failed Update Mayor Details', `Error: Mayor ID ${id} not found.`);
            return { success: false, error: `Mayor with ID ${id} not found.` };
        }

        if (mayorData.email && mayorData.email !== mayor.email) {
            const existingByEmail = await prisma.mayor.findUnique({ where: { email: mayorData.email } });
            if (existingByEmail) {
                await addLogEntry('USER_ACTION', actorId, 'Failed Update Mayor Details', `Error: Email ${mayorData.email} in use.`);
                return { success: false, error: `Email ${mayorData.email} is already in use.` };
            }
        }

        // Ensure password is not updated here
        delete (mayorData as any).password;

        const updatedMayor = await prisma.mayor.update({
            where: { id: id },
            data: mayorData,
        });

        const changes = Object.keys(mayorData)
             // Use 'any' for dynamic key access or define a more specific type
            .map(key => `${key}: '${(mayor as any)[key]}' -> '${(updatedMayor as any)[key]}'`)
            .join(', ');
        await addLogEntry('USER_ACTION', actorId, 'Updated Mayor Details', `ID: ${id}, Changes: ${changes || 'None'}`);
        console.log(`[MayorService] Mayor ${id} details updated successfully.`);
        return { success: true };

    } catch (error) {
        console.error(`[MayorService] Error updating mayor details ${id}:`, error);
        await addLogEntry('USER_ACTION', actorId, 'Failed Update Mayor Details', `ID: ${id}, Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return { success: false, error: `Database error: ${error instanceof Error ? error.message : 'Could not update mayor details.'}` };
    }
}

export async function updateMayorStatus(
    id: string,
    status: Status,
    endDate?: Date | null,
    actorId: string = 'Admin_Unknown'
): Promise<{ success: boolean; error?: string }> {
    console.log(`[MayorService] Updating status for mayor ${id} to ${status} by ${actorId}`);
    try {
        const mayor = await prisma.mayor.findUnique({ where: { id } });
        if (!mayor) {
            await addLogEntry('USER_ACTION', actorId, 'Failed Update Mayor Status', `Error: Mayor ID ${id} not found.`);
            return { success: false, error: `Mayor with ID ${id} not found.` };
        }
        const oldStatus = mayor.subscriptionStatus;
        const updatedMayor = await prisma.mayor.update({
            where: { id: id },
            data: {
                subscriptionStatus: status,
                subscriptionEndDate: endDate === undefined ? mayor.subscriptionEndDate : endDate,
            },
        });
        const endDateString = updatedMayor.subscriptionEndDate?.toLocaleDateString() || 'N/A';
        await addLogEntry('USER_ACTION', actorId, 'Updated Mayor Status', `ID: ${id}, Status: ${oldStatus} -> ${status}, EndDate: ${endDateString}`);
        console.log(`[MayorService] Mayor ${id} status updated successfully.`);
        return { success: true };
    } catch (error) {
        console.error(`[MayorService] Error updating mayor status ${id}:`, error);
        await addLogEntry('USER_ACTION', actorId, 'Failed Update Mayor Status', `ID: ${id}, Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return { success: false, error: `Database error: ${error instanceof Error ? error.message : 'Could not update status.'}` };
    }
}

export async function deleteMayor(
    id: string,
    actorId: string = 'Admin_Unknown'
): Promise<{ success: boolean; error?: string }> {
    console.log(`[MayorService] Deleting mayor ${id} by ${actorId}`);
    try {
        const mayor = await prisma.mayor.findUnique({ where: { id } });
        if (!mayor) {
            await addLogEntry('USER_ACTION', actorId, 'Failed Delete Mayor', `Error: Mayor ID ${id} not found.`);
            return { success: false, error: `Mayor with ID ${id} not found.` };
        }
        await prisma.mayor.delete({
            where: { id: id },
        });
        await addLogEntry('USER_ACTION', actorId, 'Deleted Mayor', `ID: ${id}, Name: ${mayor.name}, Village: ${mayor.village}`);
        console.log(`[MayorService] Mayor ${id} deleted successfully.`);
        return { success: true };
    } catch (error) {
        console.error(`[MayorService] Error deleting mayor ${id}:`, error);
         await addLogEntry('USER_ACTION', actorId, 'Failed Delete Mayor', `ID: ${id}, Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return { success: false, error: `Database error: ${error instanceof Error ? error.message : 'Could not delete mayor.'}` };
    }
}

// TODO: Add function for password reset if needed
// export async function resetMayorPassword(...) { ... }
