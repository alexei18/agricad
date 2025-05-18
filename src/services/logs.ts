
'use server';

import prisma from '@/lib/prisma'; // Import the Prisma client instance
import type { LogEntry as PrismaLogEntry, LogType as PrismaLogType } from '@prisma/client'; // Import generated Prisma types

// Use the Prisma type for LogEntry
export type LogEntry = PrismaLogEntry;

// Helper function to add a log entry
export async function addLogEntry(
    logType: PrismaLogType, // Use Prisma enum type
    actor: LogEntry['actor'],
    action: LogEntry['action'],
    details?: LogEntry['details']
): Promise<void> {
    console.log(`[LogService] Adding log to DB: [${logType}] Actor: ${actor || 'System'}, Action: ${action}, Details: ${details || 'N/A'}`);
    try {
        await prisma.logEntry.create({
            data: {
                logType: logType,
                actor: actor,
                action: action,
                details: details,
                // timestamp is handled by @default(now())
            },
        });
    } catch (error) {
        console.error('[LogService] Failed to add log entry to database:', error);
        // Decide how to handle logging failures. Maybe log to console or another system.
    }
}

// --- Service functions to fetch specific log types ---

// Fetch assignment logs
export async function getAssignmentLogs(limit: number = 50): Promise<LogEntry[]> {
    console.log('[LogService] Fetching assignment logs from DB');
    try {
        const logs = await prisma.logEntry.findMany({
            where: { logType: 'ASSIGNMENT' },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
        return logs;
    } catch (error) {
        console.error('[LogService] Error fetching assignment logs:', error);
        throw new Error('Could not load assignment logs.');
    }
}

// Fetch user action and system logs
export async function getUserActionLogs(limit: number = 50): Promise<LogEntry[]> {
    console.log('[LogService] Fetching user action logs from DB');
     try {
        const logs = await prisma.logEntry.findMany({
            where: {
                logType: { in: ['USER_ACTION', 'SYSTEM'] } // Fetch both types
            },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
        return logs;
    } catch (error) {
        console.error('[LogService] Error fetching user action logs:', error);
        throw new Error('Could not load user action logs.');
    }
}

// Function to clear all logs (USE WITH CAUTION)
export async function clearAllLogs(actorId: string = 'Admin_System'): Promise<{ success: boolean; error?: string }> {
    console.warn(`[LogService] !!! Attempting to clear ALL logs by ${actorId} !!!`);
    try {
        const { count } = await prisma.logEntry.deleteMany({});
        console.warn(`[LogService] !!! Successfully deleted ${count} log entries. !!!`);
        // Log the clear action itself (this log might be deleted if called immediately after)
        await addLogEntry('SYSTEM', actorId, 'Cleared All Logs', `Deleted ${count} entries.`);
        return { success: true };
    } catch (error) {
        console.error('[LogService] Error clearing logs:', error);
         await addLogEntry('SYSTEM', actorId, 'Failed Clear Logs Attempt', `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return { success: false, error: `Database error: ${error instanceof Error ? error.message : 'Could not clear logs.'}` };
    }
}
