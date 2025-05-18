'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma'; // Import Prisma client
import { addLogEntry, clearAllLogs } from '@/services/logs'; // Import the logging function and clearLogs

// --- Site Name (Still Simulated - Could be moved to DB later) ---
// Simulate storing settings (in a real app, this might be a dedicated Settings table)
let currentSettings = {
    siteName: 'AgriCad Platform',
    // Add other settings as needed
};

export async function getSettings(): Promise<{ siteName: string }> {
    console.log('[SettingsAction] Fetching settings (simulated)');
    // No DB interaction for this simulated setting yet
    try {
        await new Promise(resolve => setTimeout(resolve, 50)); // Minimal delay simulation
        return { ...currentSettings };
    } catch (error) {
        console.error('[SettingsAction] Unexpected error fetching settings:', error);
        // In a real scenario with DB fetch, rethrow or return a specific error state
        // For simulation, just return default
        return { siteName: 'AgriCad Platform' };
    }
}

const SiteNameSchema = z.string().min(3, 'Site name must be at least 3 characters').max(50, 'Site name cannot exceed 50 characters');

export async function updateSiteName(
    newName: string,
    actorId: string = 'Admin_Unknown'
): Promise<{ success: boolean; error?: string }> {
    console.log(`[SettingsAction] Attempting to update site name to: ${newName} by ${actorId} (simulated)`);

    const validation = SiteNameSchema.safeParse(newName);
    if (!validation.success) {
        const errorMessage = validation.error.errors[0].message;
        console.error(`[SettingsAction] Site name validation failed for actor ${actorId}: ${errorMessage}`);
        // Log attempt even if validation fails before trying DB
        // await addLogEntry('USER_ACTION', actorId, 'Failed Update Site Name', `Validation Error: ${errorMessage}`);
        return { success: false, error: errorMessage };
    }

    try {
        const oldName = currentSettings.siteName;
        // Simulate write delay
        await new Promise(resolve => setTimeout(resolve, 100));
        currentSettings.siteName = validation.data;

        await addLogEntry('USER_ACTION', actorId, 'Updated Site Name', `From: '${oldName}' To: '${validation.data}'`);
        console.log('[SettingsAction] Site name updated successfully.');
        return { success: true };
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'Unknown error during site name update.';
         console.error(`[SettingsAction] Error updating site name for actor ${actorId}:`, error);
         // Log the error after it happens
         // await addLogEntry('USER_ACTION', actorId, 'Failed Update Site Name', `Error: ${errorMessage}`);
         return { success: false, error: errorMessage };
    }
}
// --- End Site Name Simulation ---


// --- Data Management Actions (Using Prisma for real operations) ---

// Action to trigger a backup (Simulated - Backup logic is complex and external)
export async function triggerBackup(
     actorId: string = 'Admin_Unknown'
): Promise<{ success: boolean; message: string; error?: string }> {
    console.log(`[SettingsAction] Triggering system backup by ${actorId} (simulated)`);
    try {
        // In a real app, this would initiate a backend backup process (e.g., DB dump, file storage snapshot)
        // This is highly dependent on the hosting environment and infrastructure.
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate initiation delay

        await addLogEntry('SYSTEM', actorId, 'Triggered System Backup', 'Simulation: Backup process initiated.');
        console.log('[SettingsAction] Backup process initiated (simulation).');
        return { success: true, message: 'Backup process initiated successfully (simulation).' };
     } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during backup trigger.';
        console.error(`[SettingsAction] Error triggering backup for actor ${actorId}:`, error);
        await addLogEntry('SYSTEM', actorId, 'Failed Backup Trigger', `Error: ${errorMessage}`);
        return { success: false, message: 'Failed to trigger backup.', error: errorMessage };
    }
}

// Action to clear all DATA (Farmers, Mayors, Parcels - NOT LOGS)
// USE WITH EXTREME CAUTION!
export async function triggerClearApplicationData(
     actorId: string = 'Admin_Unknown'
): Promise<{ success: boolean; message: string; error?: string }> {
    console.warn(`[SettingsAction] !!! Triggering CLEAR APPLICATION DATA by ${actorId} !!!`);

    try {
        // Use Prisma transaction to delete data from related tables
        // Order matters due to foreign key constraints if cascading delete is not set up
        await prisma.$transaction(async (tx) => {
            // Delete relations first if necessary, or rely on cascade delete.
            // Assuming cascade deletes are set up or relations are optional/SetNull:
            await tx.parcel.deleteMany({}); // Deletes parcels and potentially related assignments via cascade
            await tx.farmer.deleteMany({}); // Deletes farmers
            await tx.mayor.deleteMany({}); // Deletes mayors
        });

        await addLogEntry('SYSTEM', actorId, 'Cleared All Application Data', 'Farmers, Mayors, and Parcels deleted.');
        console.warn('[SettingsAction] !!! All application data cleared (Farmers, Mayors, Parcels) !!!');
        return { success: true, message: 'All application data (Farmers, Mayors, Parcels) has been cleared.' };
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'Unknown error during clear data.';
         console.error(`[SettingsAction] Error during clear application data for actor ${actorId}:`, error);
         await addLogEntry('SYSTEM', actorId, 'Failed Clear Application Data Attempt', `Error: ${errorMessage}`);
         return { success: false, message: 'Failed to clear application data.', error: errorMessage };
    }
}

// Action to clear only LOGS
export async function triggerClearLogs(
     actorId: string = 'Admin_Unknown'
): Promise<{ success: boolean; message: string; error?: string }> {
     console.warn(`[SettingsAction] !!! Triggering CLEAR LOG DATA by ${actorId} !!!`);
     try {
         // Use the dedicated function from the logs service
         const result = await clearAllLogs(actorId); // clearAllLogs already has try/catch and logging
         if (!result.success) {
            // The error should have been logged by clearAllLogs, but we return it here too
            console.error(`[SettingsAction] clearAllLogs failed for actor ${actorId}: ${result.error}`);
            return {
                 success: false,
                 message: 'Failed to clear system logs.',
                 error: result.error,
            };
         }
         // Log entry for clearing is handled within clearAllLogs or just after it now.
         console.warn(`[SettingsAction] !!! Log clearing process completed for actor ${actorId}. Success: ${result.success} !!!`);
         return {
             success: true,
             message: 'All system logs have been cleared.',
             error: undefined, // Explicitly undefined on success
         };
     } catch (error) {
            // This catch block might be redundant if clearAllLogs handles its errors,
            // but it's safe to keep for unexpected issues in this action itself.
           const errorMessage = error instanceof Error ? error.message : 'Unknown error during log clearing trigger.';
           console.error(`[SettingsAction] Unexpected error during triggerClearLogs for actor ${actorId}:`, error);
           // Attempt to log this failure, though the primary failure log should come from clearAllLogs
           await addLogEntry('SYSTEM', actorId, 'Failed Clear Logs Trigger', `Unexpected Wrapper Error: ${errorMessage}`);
           return { success: false, message: 'An unexpected error occurred while trying to clear logs.', error: errorMessage };
     }
}
