// src/services/parcels.ts
'use server';

import prisma from '@/lib/prisma';
import type { Parcel as PrismaParcel, Farmer as PrismaFarmer } from '@prisma/client'; // Importă și Farmer dacă e necesar pentru tipări interne
import { LogType } from '@prisma/client';
import { addLogEntry } from './logs'; // Asigură-te că acest serviciu de logare există și funcționează
import { WGS84Coordinates } from './types'; // Asigură-te că tipul WGS84Coordinates este definit corect
                                         // de ex. export type WGS84Coordinates = Array<[number, number]>;

// Tipul Parcel pe care îl folosești în restul aplicației
// Acesta este tipul pe care funcțiile de get îl vor returna
export type Parcel = Omit<PrismaParcel, 'coordinates' | 'id'> & {
  id: string;
  coordinates: WGS84Coordinates; // [lon, lat][]
};

// Tipul datelor așteptate de la acțiunea de upload, după transformarea coordonatelor în WGS84
interface ParcelUploadData {
    id: string; // ID-ul parcelei, citit ca string din CSV
    village: string;
    area: number; // area_hectares din CSV
    coordinates: WGS84Coordinates; // Coordonate transformate în WGS84: [[lon, lat], [lon, lat], ...]
    // Poți adăuga ownerId/cultivatorId aici dacă CSV-ul tău le conține și vrei să le setezi la importul inițial
    // ownerId?: string | null;
    // cultivatorId?: string | null;
}

/**
 * Mapează un obiect PrismaParcel (așa cum vine din DB) la tipul Parcel (folosit în aplicație).
 * Principalul scop este să convertească `id` la string (dacă e necesar) și
 * să parseze/valideze câmpul `coordinates` (care este Json în DB).
 */
function mapPrismaParcel(prismaParcel: PrismaParcel): Parcel {
    let coordinates: WGS84Coordinates = [];

    if (prismaParcel.coordinates && typeof prismaParcel.coordinates === 'object' && Array.isArray(prismaParcel.coordinates)) {
        // Verificăm dacă structura este direct un array de perechi [lon, lat]
        // Acesta este formatul pe care îl salvăm în addUpdateParcelBatch
        const isValidWGS84 = (prismaParcel.coordinates as unknown[]).every(
            (coordPair): coordPair is [number, number] =>
                Array.isArray(coordPair) &&
                coordPair.length === 2 &&
                typeof coordPair[0] === 'number' &&
                typeof coordPair[1] === 'number'
        );

        if (isValidWGS84) {
            coordinates = prismaParcel.coordinates as WGS84Coordinates;
        } else {
            // Loghează un avertisment dacă formatul nu este cel așteptat
            // Acest lucru poate indica o problemă la salvarea datelor sau o structură neașteptată.
            console.warn(`[ParcelService] mapPrismaParcel: Parcel ID ${prismaParcel.id} has malformed 'coordinates' in database. Expected Array<[number, number]>. Found:`, JSON.stringify(prismaParcel.coordinates));
            // Poți decide să arunci o eroare aici sau să returnezi coordonate goale, în funcție de cât de strict vrei să fii.
        }
    } else if (prismaParcel.coordinates) {
        // Dacă `coordinates` există dar nu e un array (ceea ce nu ar trebui să se întâmple dacă e tip Json și salvăm corect)
        console.warn(`[ParcelService] mapPrismaParcel: Parcel ID ${prismaParcel.id} 'coordinates' is not an array. Found:`, typeof prismaParcel.coordinates);
    }

    return {
        ...prismaParcel,
        id: String(prismaParcel.id), // Asigurăm că id-ul este string
        coordinates: coordinates,
    };
}


// --- Funcții GET pentru parcele ---

export async function getAllParcels(): Promise<Parcel[]> {
    console.log('[ParcelService] Fetching all parcels from DB');
    try {
        const prismaParcels = await prisma.parcel.findMany({
            orderBy: { id: 'asc' } // Sau altă ordine relevantă
        });
        return prismaParcels.map(mapPrismaParcel);
    } catch (error) {
        console.error('[ParcelService] Error fetching all parcels:', error);
        throw new Error('Could not load all parcels.');
    }
}

export async function getParcelsByVillage(village: string): Promise<Parcel[]> {
    console.log(`[ParcelService] Fetching parcels for village: ${village}`);
    try {
        const prismaParcels = await prisma.parcel.findMany({
            where: { village },
            orderBy: { id: 'asc' }
        });
        return prismaParcels.map(mapPrismaParcel);
    } catch (error) {
        console.error(`[ParcelService] Error fetching parcels for village ${village}:`, error);
        throw new Error(`Could not load parcels for village ${village}.`);
    }
}

export async function getParcelsByOwner(ownerId: string): Promise<Parcel[]> {
    console.log(`[ParcelService] Fetching parcels owned by farmer ID: ${ownerId}`);
    try {
        const prismaParcels = await prisma.parcel.findMany({
            where: { ownerId },
            orderBy: { id: 'asc' }
        });
        return prismaParcels.map(mapPrismaParcel);
    } catch (error) {
        console.error(`[ParcelService] Error fetching parcels for owner ${ownerId}:`, error);
        throw new Error(`Could not load parcels for owner ${ownerId}.`);
    }
}

export async function getParcelsByCultivator(cultivatorId: string): Promise<Parcel[]> {
    console.log(`[ParcelService] Fetching parcels cultivated by farmer ID: ${cultivatorId}`);
    try {
        const prismaParcels = await prisma.parcel.findMany({
            where: { cultivatorId },
            orderBy: { id: 'asc' }
        });
        return prismaParcels.map(mapPrismaParcel);
    } catch (error) {
        console.error(`[ParcelService] Error fetching parcels for cultivator ${cultivatorId}:`, error);
        throw new Error(`Could not load parcels for cultivator ${cultivatorId}.`);
    }
}

export async function getParcelById(parcelId: string): Promise<Parcel | null> {
    console.log(`[ParcelService] Fetching parcel by ID: ${parcelId}`);
    try {
        const prismaParcel = await prisma.parcel.findUnique({
            where: { id: parcelId },
        });
        return prismaParcel ? mapPrismaParcel(prismaParcel) : null;
    } catch (error) {
        console.error(`[ParcelService] Error fetching parcel by ID ${parcelId}:`, error);
        throw new Error(`Could not load parcel ${parcelId}.`);
    }
}


// --- Funcția de Încărcare în Masă a Parcelelor (din CSV) ---
export async function addUpdateParcelBatch(
    parcelsToProcess: ParcelUploadData[]
): Promise<{ success: boolean; message?: string; error?: string; processedCount?: number, errors?: {id: string | null, error: string}[] }> {
    console.log(`[ParcelService] Starting batch update/create for ${parcelsToProcess.length} parcels.`);
    let processedCount = 0;
    const individualErrors: {id: string | null, error: string}[] = [];

    if (!parcelsToProcess || parcelsToProcess.length === 0) {
        return { success: true, message: "No parcels provided for batch processing.", processedCount: 0 };
    }

    try {
        for (const parcelData of parcelsToProcess) {
            const currentParcelLogId = parcelData.id || `INVALID_ID_ROW_${processedCount + individualErrors.length + 1}`;
            try {
                if (!parcelData.id || typeof parcelData.id !== 'string' || parcelData.id.trim() === '') {
                    const errMsg = "Parcel ID is invalid or empty.";
                    console.warn(`[ParcelService] Skipping parcel due to invalid ID:`, parcelData, errMsg);
                    individualErrors.push({id: parcelData.id || null, error: errMsg});
                    continue;
                }
                if (!parcelData.village || typeof parcelData.village !== 'string' || parcelData.village.trim() === '') {
                    const errMsg = "Parcel village is invalid or empty.";
                    console.warn(`[ParcelService] Skipping parcel ${parcelData.id} due to invalid village:`, parcelData.village, errMsg);
                    individualErrors.push({id: parcelData.id, error: errMsg});
                    continue;
                }
                 if (typeof parcelData.area !== 'number' || parcelData.area <= 0) {
                    const errMsg = "Parcel area is invalid or not a positive number.";
                    console.warn(`[ParcelService] Skipping parcel ${parcelData.id} due to invalid area:`, parcelData.area, errMsg);
                    individualErrors.push({id: parcelData.id, error: errMsg});
                    continue;
                }
                if (!Array.isArray(parcelData.coordinates) || parcelData.coordinates.length < 3) { // Poligonul trebuie să aibă cel puțin 3 vârfuri
                    const errMsg = "Parcel coordinates are invalid (must be an array of at least 3 [lon, lat] pairs).";
                    console.warn(`[ParcelService] Skipping parcel ${parcelData.id} due to invalid coordinates:`, parcelData.coordinates, errMsg);
                    individualErrors.push({id: parcelData.id, error: errMsg});
                    continue;
                }


                // Prisma așteaptă ca `coordinates` (tip Json) să fie un JsonValue.
                // `parcelData.coordinates` este WGS84Coordinates ( Array<[number, number]> ), ceea ce este un JsonValue valid.
                const prismaCoordinatesPayload = parcelData.coordinates as any; // Cast la any pentru Prisma, deși tipul e corect

                await prisma.parcel.upsert({
                    where: { id: parcelData.id },
                    update: {
                        village: parcelData.village.trim(),
                        area: parcelData.area,
                        coordinates: prismaCoordinatesPayload,
                        // ownerId: undefined, // Nu modificăm owner/cultivator la importul masiv de geometrii
                        // cultivatorId: undefined, // Atribuirile se fac separat
                    },
                    create: {
                        id: parcelData.id.trim(),
                        village: parcelData.village.trim(),
                        area: parcelData.area,
                        coordinates: prismaCoordinatesPayload,
                        // ownerId: null, // Se setează null inițial
                        // cultivatorId: null,
                    },
                });
                processedCount++;
            } catch (e) {
                const errorMsg = e instanceof Error ? e.message : 'Unknown error during parcel upsert';
                console.error(`[ParcelService] Error processing parcel ID ${currentParcelLogId}:`, errorMsg, e);
                individualErrors.push({id: currentParcelLogId, error: errorMsg});
            }
        }

        const totalAttempted = parcelsToProcess.length;
        if (individualErrors.length > 0) {
            const summaryError = `Processed ${processedCount} of ${totalAttempted} parcels. Failed to process ${individualErrors.length} parcels.`;
            console.warn('[ParcelService] Batch processing completed with errors:', summaryError);
            // Folosim enum-ul corect aici
            await addLogEntry(LogType.PARCEL_UPLOAD, 'Admin_Batch_Process', 'Batch Process With Errors', `${summaryError} First error: ${individualErrors[0].id} - ${individualErrors[0].error}`);
            return {
                success: processedCount > 0,
                message: summaryError,
                processedCount,
                errors: individualErrors,
                error: `One or more parcels failed to process. ${processedCount} successful.`
            };
        }

        console.log(`[ParcelService] Batch update/create completed successfully for ${processedCount} of ${totalAttempted} parcels.`);
        // Folosim enum-ul corect aici
        await addLogEntry(LogType.PARCEL_UPLOAD, 'Admin_Batch_Process', 'Batch Process Success', `Successfully processed ${processedCount} parcels.`);
        return { success: true, message: `Successfully processed ${processedCount} parcels.`, processedCount };

    } catch (batchError) {
        const errorMsg = batchError instanceof Error ? batchError.message : 'Unknown batch processing error';
        console.error('[ParcelService] Critical error during batch parcel processing:', errorMsg, batchError);
        // Folosim enum-ul corect aici
        await addLogEntry(LogType.PARCEL_UPLOAD, 'Admin_Batch_Process', 'Batch Process Critical Error', `Error: ${errorMsg}`);
        return { success: false, error: `Batch processing failed critically: ${errorMsg}`, processedCount };
    }
}



// --- Funcția de Atribuire Parcele (cu gestionarea conflictelor) ---

export interface ParcelAssignmentConflict {
    parcelId: string;
    currentOwnerId?: string | null;
    currentOwnerName?: string | null;
    currentCultivatorId?: string | null;
    currentCultivatorName?: string | null;
    attemptedAssignmentType: 'owner' | 'cultivator';
    attemptingToAssignToFarmerId: string;
    attemptingToAssignToFarmerName: string;
}

export interface AssignmentResult {
    success: boolean;
    message?: string;
    error?: string;
    conflicts?: ParcelAssignmentConflict[];
}

export async function assignParcelsToFarmer(
    targetFarmerId: string,
    desiredOwnedParcelIds: string[],
    desiredCultivatedParcelIds: string[],
    actorId: string = 'Mayor_Unknown',
    forceAssignments: boolean = false
): Promise<AssignmentResult> {
    console.log(`[ParcelService] Assigning to farmer ${targetFarmerId}. Desired Owned: [${desiredOwnedParcelIds.join(',') || 'None'}] Desired Cultivated: [${desiredCultivatedParcelIds.join(',') || 'None'}] By: ${actorId}. Force: ${forceAssignments}`);

    try {
        const targetFarmer = await prisma.farmer.findUnique({ where: { id: targetFarmerId } });
        if (!targetFarmer) {
            await addLogEntry('ASSIGNMENT', actorId, 'Failed Assignment', `Error: Target Farmer ID ${targetFarmerId} not found.`);
            return { success: false, error: `Fermierul țintă cu ID ${targetFarmerId} nu a fost găsit.` };
        }
        const village = targetFarmer.village;

        // Adună toate ID-urile de parcele ce ar putea fi afectate
        const allPotentiallyAffectedIds = new Set<string>();
        desiredOwnedParcelIds.forEach(id => allPotentiallyAffectedIds.add(id));
        desiredCultivatedParcelIds.forEach(id => allPotentiallyAffectedIds.add(id));

        const currentlyAssignedToTargetFarmer = await prisma.parcel.findMany({
            where: { village, OR: [{ ownerId: targetFarmerId }, { cultivatorId: targetFarmerId }] },
            select: { id: true }
        });
        currentlyAssignedToTargetFarmer.forEach(p => allPotentiallyAffectedIds.add(p.id));
        
        const uniqueParcelIdsToCheck = Array.from(allPotentiallyAffectedIds);

        // Dacă nu sunt ID-uri dorite și fermierul nu are nimic asignat, nu facem nimic
        if (desiredOwnedParcelIds.length === 0 && desiredCultivatedParcelIds.length === 0 && currentlyAssignedToTargetFarmer.length === 0) {
            console.log(`[ParcelService] No changes needed for farmer ${targetFarmerId} as no parcels are desired and none are currently assigned.`);
            return { success: true, message: `Nicio modificare necesară pentru ${targetFarmer.name}.`};
        }

        const parcelsInDB = await prisma.parcel.findMany({
            where: { id: { in: uniqueParcelIdsToCheck.length > 0 ? uniqueParcelIdsToCheck : undefined }, village: village }, // Handle empty uniqueParcelIdsToCheck
            include: {
                owner: { select: { id: true, name: true } },
                cultivator: { select: { id: true, name: true } }
            }
        });

        const foundParcelIdsInDB = new Set(parcelsInDB.map(p => p.id));
        const allDesiredIds = new Set([...desiredOwnedParcelIds, ...desiredCultivatedParcelIds]);
        const invalidDesiredIds = Array.from(allDesiredIds).filter(id => !foundParcelIdsInDB.has(id));

        if (invalidDesiredIds.length > 0) {
            const errorMsg = `Următoarele ID-uri de parcele sunt invalide sau nu aparțin satului ${village}: ${[...new Set(invalidDesiredIds)].join(', ')}`;
            await addLogEntry('ASSIGNMENT', actorId, 'Failed Assignment', `Invalid parcels for ${targetFarmer.name}: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }

        // Detectarea conflictelor
        const conflicts: ParcelAssignmentConflict[] = [];
        if (!forceAssignments) {
            for (const parcelId of desiredOwnedParcelIds) {
                const parcel = parcelsInDB.find(p => p.id === parcelId);
                if (parcel?.ownerId && parcel.ownerId !== targetFarmerId) {
                    conflicts.push({
                        parcelId: parcel.id, currentOwnerId: parcel.ownerId, currentOwnerName: parcel.owner?.name || 'Nec.',
                        attemptedAssignmentType: 'owner', attemptingToAssignToFarmerId: targetFarmerId, attemptingToAssignToFarmerName: targetFarmer.name
                    });
                }
            }
            for (const parcelId of desiredCultivatedParcelIds) {
                const parcel = parcelsInDB.find(p => p.id === parcelId);
                // Un conflict de cultivator apare dacă:
                // 1. Parcela are un cultivator.
                // 2. Acest cultivator NU este fermierul țintă.
                // 3. Acest cultivator NU este proprietarul curent al parcelei (caz în care proprietarul e și cultivator default).
                // SAU dacă se încearcă atribuirea cultivării către targetFarmer, dar parcela nu va fi deținută de targetFarmer.
                // (Am simplificat logica: un conflict e dacă e cultivată de altcineva și nu de targetFarmer)
                if (parcel?.cultivatorId && parcel.cultivatorId !== targetFarmerId) {
                     // Verifică dacă se încearcă atribuirea cultivării către targetFarmer care NU devine proprietar, iar parcela e cultivată de altcineva (care nu e proprietarul curent)
                    const willBeOwnedByTarget = desiredOwnedParcelIds.includes(parcel.id);
                    if (!willBeOwnedByTarget || (willBeOwnedByTarget && parcel.cultivatorId !== parcel.ownerId)) {
                        conflicts.push({
                            parcelId: parcel.id, currentCultivatorId: parcel.cultivatorId, currentCultivatorName: parcel.cultivator?.name || 'Nec.',
                            attemptedAssignmentType: 'cultivator', attemptingToAssignToFarmerId: targetFarmerId, attemptingToAssignToFarmerName: targetFarmer.name
                        });
                    }
                }
            }
        }

        if (conflicts.length > 0 && !forceAssignments) {
            console.log(`[ParcelService] Assignment conflicts for ${targetFarmerId}:`, conflicts.length);
            return { success: false, conflicts: conflicts, message: `Au fost detectate ${conflicts.length} conflicte.` };
        }

        await prisma.$transaction(async (tx) => {
            const ownedSet = new Set(desiredOwnedParcelIds);
            const cultivatedSet = new Set(desiredCultivatedParcelIds);

            // Parcellele care erau ale fermierului țintă dar nu mai sunt în lista `desired`
            const parcelsToDeassignOwner = parcelsInDB.filter(p => p.ownerId === targetFarmerId && !ownedSet.has(p.id));
            for (const parcel of parcelsToDeassignOwner) {
                await tx.parcel.update({ where: { id: parcel.id }, data: { ownerId: null } });
                console.log(`[ParcelService TX] Deassigned owner ${targetFarmerId} from parcel ${parcel.id}`);
            }

            const parcelsToDeassignCultivator = parcelsInDB.filter(p => p.cultivatorId === targetFarmerId && !cultivatedSet.has(p.id));
            for (const parcel of parcelsToDeassignCultivator) {
                await tx.parcel.update({ where: { id: parcel.id }, data: { cultivatorId: null } });
                 console.log(`[ParcelService TX] Deassigned cultivator ${targetFarmerId} from parcel ${parcel.id}`);
            }

            // Atribuie proprietate
            for (const parcelId of desiredOwnedParcelIds) {
                 const parcel = parcelsInDB.find(p => p.id === parcelId);
                 if (parcel && parcel.ownerId !== targetFarmerId) { // Atribuie doar dacă nu e deja al lui
                    await tx.parcel.update({ where: { id: parcelId }, data: { ownerId: targetFarmerId } });
                    console.log(`[ParcelService TX] Assigned owner ${targetFarmerId} to parcel ${parcelId}`);
                 } else if (!parcel) { // Nu ar trebui să se întâmple din cauza validării de mai sus
                    console.warn(`[ParcelService TX] Parcel ${parcelId} for owner assignment not found in preloaded batch.`);
                 }
            }

            // Atribuie cultivare
            for (const parcelId of desiredCultivatedParcelIds) {
                const parcel = parcelsInDB.find(p => p.id === parcelId);
                if (parcel && parcel.cultivatorId !== targetFarmerId) { // Atribuie doar dacă nu e deja cultivat de el
                    await tx.parcel.update({ where: { id: parcelId }, data: { cultivatorId: targetFarmerId } });
                    console.log(`[ParcelService TX] Assigned cultivator ${targetFarmerId} to parcel ${parcelId}`);
                } else if (!parcel) {
                    console.warn(`[ParcelService TX] Parcel ${parcelId} for cultivator assignment not found in preloaded batch.`);
                }
            }
        });

        await addLogEntry('ASSIGNMENT', actorId, 'Assigned Parcels', `Fmr: ${targetFarmer.name}. Own: [${desiredOwnedParcelIds.join(',')||'N'}] Cult: [${desiredCultivatedParcelIds.join(',')||'N'}] F:${forceAssignments}`);
        return { success: true, message: `Parcelele pentru ${targetFarmer.name} au fost actualizate.` };

    } catch (error) {
        console.error('[ParcelService] Error during parcel assignment:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown assignment error';
        await addLogEntry('ASSIGNMENT', actorId, 'Failed Assign', `FmrID: ${targetFarmerId}. Err: ${errorMsg}`);
        return { success: false, error: `Eroare la atribuire: ${errorMsg}` };
    }
}