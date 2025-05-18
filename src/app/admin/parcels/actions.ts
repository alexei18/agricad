
'use server';

import { z } from 'zod';
import proj4 from 'proj4'; // Changed import style back
import { addUpdateParcelBatch } from '@/services/parcels';
import { parseCsv } from '@/lib/csv-utils';
import type { WGS84Coordinates } from '@/services/types';

// --- Definirea Sistemelor de Coordonate ---
// Target CRS (WGS84)
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
// Source CRS (User-provided definition based on feedback)
const sourceCrsIdentifier = 'MOLDOVA_LOCAL_TM_GRS80';
proj4.defs(sourceCrsIdentifier, '+proj=tmerc +lat_0=0 +lon_0=28.4 +k=0.9999400000000001 +x_0=200000 +y_0=-5000000 +ellps=GRS80 +units=m +no_defs');
console.log(`[Proj4] Defined source CRS: ${sourceCrsIdentifier}`);
// --- Sfârșit Definire ---


// Define the expected structure for a projected coordinate pair [X, Y]
const ProjectedCoordinateSchema = z.tuple([z.number(), z.number()]);

// Custom Zod transformer to parse Projected Polygon string and transform to WGS84
const ProjectedPolygonToWGS84Schema = z.string()
  .min(10, 'Projected Polygon string seems too short')
  .refine(val => /^POLYGON\s*\(\(.*\)\)$/i.test(val), {
    message: 'Projected Polygon string must start with POLYGON(( and end with ))',
  })
  .transform((val, ctx): WGS84Coordinates => {
    try {
      const coordinateString = val.replace(/^POLYGON\s*\(\(|\)\)$/gi, '');
      const pairs = coordinateString.split(',').map(pair => pair.trim());
      const transformedCoordinates: WGS84Coordinates = [];

      for (const pair of pairs) {
        const nums = pair.split(/\s+/).map(Number);
        const validationResult = ProjectedCoordinateSchema.safeParse(nums);
        if (!validationResult.success) {
          throw new Error(`Invalid projected coordinate pair format: "${pair}"`);
        }
        const [projX, projY] = validationResult.data; // These are the projected X, Y

        // --- Transformarea folosind DEFINIȚIA CORECTĂ GĂSITĂ ---
        let transformedPair: number[];
        try {
             // Use proj4 default export function
             transformedPair = proj4(sourceCrsIdentifier, 'EPSG:4326', [projX, projY]);
        } catch (transformError) {
             console.error(`[Proj4] Transformation failed for [${projX}, ${projY}] using source ${sourceCrsIdentifier}:`, transformError);
             throw new Error(`Coordinate transformation failed for [${projX}, ${projY}]. Error: ${transformError instanceof Error ? transformError.message : 'Unknown proj4 error'}`);
        }
        const [longitude, latitude] = transformedPair;
        // ----------------------------------------------------------

        // Verificare validitate WGS84 (după transformare)
        if (isNaN(longitude) || isNaN(latitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          console.warn(`[ParcelUploadAction] Coordinate transformation resulted in invalid WGS84 values for projected [${projX}, ${projY}] -> WGS84 [${longitude}, ${latitude}] using source ${sourceCrsIdentifier}`);
          throw new Error(`Invalid WGS84 coordinate after transformation: [${longitude}, ${latitude}] for input [${projX}, ${projY}]`);
        }
        transformedCoordinates.push([longitude, latitude]); // Adaugă [lon, lat]
      }

      if (transformedCoordinates.length < 3) {
        throw new Error('Polygon must have at least 3 valid coordinate pairs after transformation.');
      }
      // Ensure polygon is closed (optional, depends on source data consistency)
      if (transformedCoordinates.length > 0) {
          const firstLon = transformedCoordinates[0][0];
          const firstLat = transformedCoordinates[0][1];
          const lastLon = transformedCoordinates[transformedCoordinates.length - 1][0];
          const lastLat = transformedCoordinates[transformedCoordinates.length - 1][1];
           // Use a small tolerance for floating point comparison
          if (Math.abs(firstLon - lastLon) > 1e-9 || Math.abs(firstLat - lastLat) > 1e-9) {
             transformedCoordinates.push([firstLon, firstLat]); // Close the polygon
          }
      }
      // Prisma stores as JSON, expecting [lon, lat] format which we now provide
      return transformedCoordinates;
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: e instanceof Error ? e.message : 'Invalid Polygon format or transformation failed',
      });
      return z.NEVER; // Indicates a transformation failure
    }
  });

// Define the expected structure of a row in the CSV for Prisma
// parcel_id is now a string, projected_polygon uses the transformer
const ParcelDataSchema = z.object({
  parcel_id: z.string().trim().min(1, 'Parcel ID cannot be empty'), // Keep as string
  area_hectares: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(',', '.').trim()) : val),
    z.number().positive('Area must be a positive number')
  ),
  projected_polygon: ProjectedPolygonToWGS84Schema, // Use the transformer for WGS84 coords
  village: z.string().min(1, 'Village name cannot be empty').trim(),
});

// Type for the action's return value
type ActionResult = {
  success: boolean;
  message: string;
  processedCount?: number;
  errorDetails?: string[];
  error?: string; // Include top-level error message if needed
};

// Placeholder for the admin user ID performing the upload
const adminActorId = "Admin_Upload";

export async function uploadParcelsAction(formData: FormData): Promise<ActionResult> {
  const file = formData.get('parcelFile') as File | null;

  if (!file) {
    console.warn('[ParcelUploadAction] No file found in FormData.');
    return { success: false, message: 'No file uploaded.' };
  }
  if (file.size === 0) {
     console.warn('[ParcelUploadAction] Uploaded file is empty.');
    return { success: false, message: 'Uploaded file is empty.' };
  }

  // Basic type check on the server
  const allowedTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
   if (!allowedTypes.some(type => file.type.startsWith(type)) && file.type !== 'text/plain' && file.type !== '') {
        console.warn(`[ParcelUploadAction] Invalid file type detected on server: ${file.type}`);
        return { success: false, message: `Invalid file type: ${file.type || 'Unknown'}. Only CSV files are allowed.` };
   }

  let fileContent: string;
  try {
    fileContent = await file.text();
  } catch (readError) {
      console.error('[ParcelUploadAction] Error reading file content:', readError);
      return {
          success: false,
          message: `Error reading file: ${readError instanceof Error ? readError.message : 'Could not read file content.'}`,
      };
  }

  try {
    const parsedData = await parseCsv(fileContent); // Await the async parseCsv

    if (!parsedData || parsedData.length === 0) {
       // Check if it only contains header
       const lines = fileContent.trim().split('\n');
       if (lines.length === 1 && lines[0].trim() !== '') {
            console.warn('[ParcelUploadAction] CSV only contains header row.');
           return { success: false, message: 'CSV file only contains a header row. No parcel data found.' };
       }
       console.warn('[ParcelUploadAction] CSV is empty or could not be parsed.');
       return { success: false, message: 'CSV file is empty or could not be parsed correctly.' };
    }

    // --- Check for 'projected_polygon' header ---
    const headers = Object.keys(parsedData[0] || {});
    const requiredHeaders = ['parcel_id', 'area_hectares', 'projected_polygon', 'village'];
    const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
    if (missingHeaders.length > 0) {
        console.warn(`[ParcelUploadAction] Missing required CSV columns: ${missingHeaders.join(', ')}`);
        return { success: false, message: `Missing required CSV columns: ${missingHeaders.join(', ')}. Expected 'projected_polygon' for coordinates.` };
    }
    // -----------------------------------------------------

    // Prepare data structure for the Prisma service
    const parcelsToUpload: {
        id: string; // ID is string
        village: string;
        area: number;
        coordinates: WGS84Coordinates; // This will hold the *transformed* WGS84 coords
    }[] = [];
    const validationErrors: string[] = [];
    console.log(`[ParcelUploadAction] Starting validation and transformation for ${parsedData.length} rows...`);

    parsedData.forEach((row, index) => {
      const validationResult = ParcelDataSchema.safeParse(row);
      if (validationResult.success) {
        // Map the validated and transformed data to the structure expected by the service
        parcelsToUpload.push({
          id: validationResult.data.parcel_id,         // Map parcel_id -> id (already string)
          village: validationResult.data.village,      // Name is the same
          area: validationResult.data.area_hectares,   // Map area_hectares -> area
          coordinates: validationResult.data.projected_polygon // Use the transformed WGS84 coordinates
        });
      } else {
        // Log detailed error with row number and specific field issues
        console.warn(`[ParcelUploadAction] Validation/Transformation failed for row ${index + 2}:`, { rowData: row, errors: validationResult.error.flatten().fieldErrors });
         const errorMessages = validationResult.error.errors.map(e => {
             // Construct a more informative error message including the path
             const path = e.path.join('.');
             return `Row ${index + 2}, Column '${path}': ${e.message}`;
         }).join('; ');
        validationErrors.push(errorMessages);
      }
    });
     console.log(`[ParcelUploadAction] Validation finished. Valid rows: ${parcelsToUpload.length}, Errors: ${validationErrors.length}`);

    if (validationErrors.length > 0) {
        // Log the first few detailed errors for easier debugging
        console.error("[ParcelUploadAction] Validation/Transformation Errors found:", validationErrors.slice(0, 10));
        const errorsToShowSummary = validationErrors.slice(0, 5).join('; ');
        const moreErrorsMsg = validationErrors.length > 5 ? ` (and ${validationErrors.length - 5} more errors)` : '';
        return {
            success: false,
            message: `Validation/Transformation failed. See details below. First few errors: ${errorsToShowSummary}${moreErrorsMsg}`,
            errorDetails: validationErrors
        };
    }

    if (parcelsToUpload.length === 0) {
         console.warn('[ParcelUploadAction] No valid parcel data found after validation/transformation.');
         return { success: false, message: 'No valid parcel data found in the file after validation and transformation.' };
    }

    // --- Database Interaction via Prisma Service ---
    console.log(`[ParcelUploadAction] Attempting to upload/update ${parcelsToUpload.length} validated/transformed parcels via Prisma service.`);
    // Service expects 'coordinates' field with WGS84 data
    const dbResult = await addUpdateParcelBatch(parcelsToUpload);
    if (!dbResult.success) {
       console.error('[ParcelUploadAction] Database batch update failed:', dbResult.error);
       return {
           success: false,
           message: `Database error during batch processing: ${dbResult.error || 'Unknown error'} (Processed before error: ${dbResult.processedCount ?? 0})`,
           error: dbResult.error,
           processedCount: dbResult.processedCount
        };
    }
    // -----------------------------------------

    console.log(`[ParcelUploadAction] Successfully processed '${file.name}'. Processed count: ${dbResult.processedCount || parcelsToUpload.length}`);
    return {
      success: true,
      message: `Successfully processed ${dbResult.processedCount ?? parcelsToUpload.length} parcels from '${file.name}'.`,
      processedCount: dbResult.processedCount || parcelsToUpload.length,
    };

  } catch (error) {
    console.error('[ParcelUploadAction] Unexpected critical error processing parcel file:', error);
    // Log the full error object for more details
    console.error('[ParcelUploadAction] Full error object:', JSON.stringify(error, null, 2));
    return {
      success: false,
      message: error instanceof Error ? `Critical processing error: ${error.message}` : 'An unexpected server error occurred during file processing.',
      error: error instanceof Error ? error.message : 'Unknown critical processing error',
    };
  }
}
