'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, useMap, useMapEvents, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression, LatLng, Map as LeafletMap } from 'leaflet';
import { Parcel } from '@/services/parcels';
import type { Farmer } from '@prisma/client'; // Asigură-te că acest tip este corect
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Ruler } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as turf from '@turf/turf';

// --- Leaflet Icon Fix ---
const setupLeafletIcons = () => {
    if (typeof window !== 'undefined' && typeof L !== 'undefined') {
        if (!(L.Icon.Default.prototype as any)._iconUrl) {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
        }
    }
};

const UNASSIGNED_COLOR = 'hsl(0, 0%, 70%)'; // Gri pentru neatribuit/neutru
const HIGHLIGHT_COLOR = 'hsl(var(--accent))'; // Pentru selecție
const OTHER_PARCEL_COLOR = 'hsl(0, 0%, 85%)'; // Culoare neutră pentru alte parcele (când se evidențiază un fermier)


export type MapViewType = 'standard' | 'satellite' | 'terrain' | 'hybrid';

// --- MODIFICAT: ParcelMapProps ---
interface ParcelMapProps {
    parcels: Parcel[];
    village: string;
    farmers?: Omit<Farmer, 'password'>[]; // Folosim Omit pentru a exclude parola
    mapViewType?: MapViewType;
    highlightFarmerId?: string | null; // ID-ul fermierului ale cărui parcele să fie evidențiate
    showAllFarmersColors?: boolean;   // Flag pentru a afișa culorile tuturor fermierilor
}

const ZOOM_LEVEL_HIDE_INDIVIDUAL = 11;
const ZOOM_LEVEL_SIMPLIFY_START = 13;
const ZOOM_LEVEL_FULL_DETAIL = 15;
const SIMPLIFICATION_TOLERANCE_LOW_DETAIL = 0.0005;
const SIMPLIFICATION_TOLERANCE_MEDIUM_DETAIL = 0.0001;

type TurfCoord = [number, number];
type TurfRing = TurfCoord[];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; const φ1 = lat1 * Math.PI / 180; const φ2 = lat2 * Math.PI / 180; const Δφ = (lat2 - lat1) * Math.PI / 180; const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c;
}
interface DimensionInfo { midPoint: LatLng; length: number; segmentIndex: number; }
function calculateDimensions(coordinates: LatLngExpression[]): DimensionInfo[] {
    const dimensions: DimensionInfo[] = []; if (coordinates.length < 2) return dimensions;
    for (let i = 0; i < coordinates.length - 1; i++) {
        const p1 = coordinates[i] as [number, number]; const p2 = coordinates[i + 1] as [number, number];
        const length = calculateDistance(p1[0], p1[1], p2[0], p2[1]);
        const midLat = (p1[0] + p2[0]) / 2; const midLon = (p1[1] + p2[1]) / 2;
        dimensions.push({ midPoint: L.latLng(midLat, midLon), length: Math.round(length), segmentIndex: i + 1 });
    } return dimensions;
}

// --- MODIFICAT: OptimizedParcelRendererProps ---
interface OptimizedParcelRendererProps {
    allParcels: Parcel[];
    farmers?: Omit<Farmer, 'password'>[];
    map: L.Map;
    currentZoom: number;
    selectedParcelId: string | null;
    setSelectedParcelId: (id: string | null) => void;
    setParcelDimensions: (dims: DimensionInfo[]) => void;
    highlightFarmerId?: string | null; // Prop pasat mai departe
    showAllFarmersColors?: boolean;    // Prop pasat mai departe
}

const OptimizedParcelRenderer: React.FC<OptimizedParcelRendererProps> = ({
    allParcels, farmers, map, currentZoom, selectedParcelId, setSelectedParcelId, setParcelDimensions,
    highlightFarmerId, showAllFarmersColors
}) => {
    const [parcelsToRender, setParcelsToRender] = React.useState<Parcel[]>([]);
    React.useEffect(() => {
        if (!map || !allParcels) return;
        if (currentZoom < ZOOM_LEVEL_HIDE_INDIVIDUAL) { setParcelsToRender([]); return; }
        const mapBounds = map.getBounds(); let visibleParcels: Parcel[] = [];
        for (const parcel of allParcels) {
            if (parcel.coordinates && parcel.coordinates.length >= 3) {
                const lats = parcel.coordinates.map(c => c[1]); const lngs = parcel.coordinates.map(c => c[0]);
                const parcelGeoJsonBounds: [number, number, number, number] = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
                const parcelLeafletBounds = L.latLngBounds(L.latLng(parcelGeoJsonBounds[1], parcelGeoJsonBounds[0]), L.latLng(parcelGeoJsonBounds[3], parcelGeoJsonBounds[2]));
                if (mapBounds.intersects(parcelLeafletBounds)) visibleParcels.push(parcel);
            }
        }
        if (currentZoom >= ZOOM_LEVEL_SIMPLIFY_START && currentZoom < ZOOM_LEVEL_FULL_DETAIL) {
            const tolerance = currentZoom < (ZOOM_LEVEL_SIMPLIFY_START + ZOOM_LEVEL_FULL_DETAIL) / 2 ? SIMPLIFICATION_TOLERANCE_LOW_DETAIL : SIMPLIFICATION_TOLERANCE_MEDIUM_DETAIL;
            visibleParcels = visibleParcels.map(parcel => {
                if (parcel.coordinates.length < 4) return parcel;
                try {
                    const ringCoordinates = parcel.coordinates as TurfRing;
                    const turfPolygon = turf.polygon([ringCoordinates]);
                    const simplified = turf.simplify(turfPolygon, { tolerance, highQuality: false });
                    if (simplified?.geometry?.coordinates?.[0] && simplified.geometry.coordinates[0].length >= 4) {
                        return { ...parcel, coordinates: simplified.geometry.coordinates[0] as TurfRing };
                    }
                } catch (error) { return parcel; }
                return parcel;
            });
        }
        setParcelsToRender(visibleParcels);
    }, [allParcels, map, currentZoom]);

    return (
        <>
            {parcelsToRender.map((parcel) => {
                const latLngs = parcel.coordinates.map(coord => (Array.isArray(coord) && coord.length === 2 ? [coord[1], coord[0]] as LatLngExpression : null)).filter(Boolean) as LatLngExpression[];
                if (latLngs.length < 3) return null;

                const owner = farmers?.find(f => f.id === parcel.ownerId);
                // const cultivator = farmers?.find(f => f.id === parcel.cultivatorId); // Nu e folosit direct la colorare aici
                const isSelected = parcel.id === selectedParcelId;
                let parcelColor = UNASSIGNED_COLOR;
                let fillOpacity = isSelected ? 0.6 : 0.4; // Opacitate puțin mai mare la selecție

                if (showAllFarmersColors) {
                    parcelColor = owner?.color || UNASSIGNED_COLOR;
                } else if (highlightFarmerId) {
                    if (owner?.id === highlightFarmerId) {
                        parcelColor = owner?.color || HIGHLIGHT_COLOR; // Culoarea fermierului sau un highlight generic
                        fillOpacity = isSelected ? 0.7 : 0.5; // Mai opac pentru fermierul evidențiat
                    } else {
                        parcelColor = OTHER_PARCEL_COLOR; // Neutru pentru celelalte
                    }
                } else {
                    // Fallback dacă nu e niciun mod special (poate fi culoarea proprietarului sau unassigned)
                    parcelColor = owner?.color || UNASSIGNED_COLOR;
                }

                return (
                    <Polygon key={`${parcel.id}-${currentZoom}-${parcel.coordinates.length}`}
                        pathOptions={{
                            color: isSelected ? HIGHLIGHT_COLOR : parcelColor, // Contur selectat sau culoarea parcelei
                            weight: isSelected ? 3 : 2,
                            fillColor: parcelColor, // Culoarea de umplere determinată mai sus
                            fillOpacity: fillOpacity,
                        }}
                        positions={latLngs}
                        eventHandlers={{
                            click: (e) => {
                                L.DomEvent.stopPropagation(e); setSelectedParcelId(parcel.id);
                                const originalParcel = allParcels.find(p => p.id === parcel.id);
                                const coordsForDimensionCalc = originalParcel ? originalParcel.coordinates.map(coord => [coord[1], coord[0]] as LatLngExpression) : latLngs;
                                setParcelDimensions(calculateDimensions(coordsForDimensionCalc));
                            },
                        }}
                    >
                        <Tooltip>Parc.: {parcel.id}<br />Sup.: {parcel.area.toFixed(2)} ha<br />Prop.: {owner?.name || 'N/A'}</Tooltip>
                    </Polygon>
                );
            })}
        </>
    );
};

const FitBounds: React.FC<{ parcelsToFit?: Parcel[]; onFitted?: () => void }> = ({ parcelsToFit, onFitted }) => {
    const map = useMap();
    React.useEffect(() => {
        if (!map || !parcelsToFit || parcelsToFit.length === 0) {
            if (onFitted) onFitted(); // Semnalează că nu e nimic de făcut
            return;
        }
        try {
            const bounds = L.latLngBounds([]); let validPolygons = 0;
            parcelsToFit.forEach(parcel => {
                const latLngs = parcel.coordinates.map(coord => (Array.isArray(coord) && coord.length === 2 ? [coord[1], coord[0]] as LatLngExpression : null)).filter(Boolean) as LatLngExpression[];
                if (latLngs.length >= 3) { try { bounds.extend(L.polygon(latLngs).getBounds()); validPolygons++; } catch (e) { } }
            });
            if (validPolygons > 0 && bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
            } else if (parcelsToFit.length > 0) {
                map.setView([47.77, 27.92], 13);
            }
        } catch (error) {
            if (parcelsToFit.length > 0) map.setView([47.77, 27.92], 13);
        } finally {
            if (onFitted) onFitted(); // Semnalează finalizarea (chiar dacă a fost eroare sau default view)
        }
    }, [map, parcelsToFit, onFitted]);
    return null;
};

const DynamicTileLayer: React.FC<{ mapViewType: MapViewType }> = ({ mapViewType }) => {
    const map = useMap(); const currentTileLayerRef = React.useRef<L.TileLayer | null>(null);
    React.useEffect(() => {
        let newTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"; let newAttribution = '© OSM contributors'; let newMaxZoom = 19; let newSubdomains: string | string[] = ['a', 'b', 'c'];
        switch (mapViewType) {
            case 'satellite': newTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'; newAttribution = 'Tiles © Esri'; newMaxZoom = 18; newSubdomains = []; break;
            case 'terrain': newTileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'; newAttribution = 'Map data: OSM, SRTM | Map style: OpenTopoMap'; newMaxZoom = 17; break;
            case 'hybrid': newTileUrl = 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}'; newAttribution = '© Google Maps'; newMaxZoom = 20; newSubdomains = ['mt0','mt1','mt2','mt3']; break;
        }
        if (currentTileLayerRef.current) map.removeLayer(currentTileLayerRef.current);
        const newLayer = L.tileLayer(newTileUrl, { attribution: newAttribution, maxZoom: newMaxZoom, subdomains: newSubdomains }).addTo(map); currentTileLayerRef.current = newLayer;
        return () => { if (map && newLayer && map.hasLayer(newLayer)) map.removeLayer(newLayer); };
    }, [mapViewType, map]);
    return null;
};

// --- MODIFICAT: ParcelMap ---
export function ParcelMap({
    parcels: allParcelsFromProps,
    village,
    farmers,
    mapViewType = 'standard',
    highlightFarmerId = null,      // Valoare default null
    showAllFarmersColors = false // Valoare default false
}: ParcelMapProps) {
    const [isMounted, setIsMounted] = React.useState(false);
    const [selectedParcelId, setSelectedParcelId] = React.useState<string | null>(null);
    const [currentParcelDimensions, setCurrentParcelDimensions] = React.useState<DimensionInfo[]>([]);
    const mapRef = React.useRef<LeafletMap | null>(null);
    const [currentZoom, setCurrentZoom] = React.useState<number>(13);
    const [initialBoundsFitted, setInitialBoundsFitted] = React.useState(false);

    const parcelsForInitialFit = React.useMemo(() => {
        if (allParcelsFromProps && allParcelsFromProps.length > 0) {
            // Dacă highlightFarmerId este setat și showAllFarmersColors e false,
            // facem fit pe parcelele acelui fermier. Altfel, pe un subset general.
            if (highlightFarmerId && !showAllFarmersColors) {
                const highlightedFarmerParcels = allParcelsFromProps.filter(p => p.ownerId === highlightFarmerId);
                return highlightedFarmerParcels.length > 0 ? highlightedFarmerParcels : allParcelsFromProps.slice(0, 50); // fallback la un subset mic
            }
            return allParcelsFromProps.slice(0, Math.min(allParcelsFromProps.length, 100));
        }
        return [];
    }, [allParcelsFromProps, highlightFarmerId, showAllFarmersColors]);

    const selectedParcelInfo = React.useMemo(() => {
        if (!selectedParcelId) return null;
        return allParcelsFromProps.find(p => p.id === selectedParcelId);
    }, [selectedParcelId, allParcelsFromProps]);

    React.useEffect(() => { setIsMounted(true); setupLeafletIcons(); }, []);
    React.useEffect(() => {
        setSelectedParcelId(null); setCurrentParcelDimensions([]);
        // Resetăm initialBoundsFitted doar dacă setul principal de date (allParcelsFromProps) se schimbă.
        // Sau dacă highlightFarmerId se schimbă și vrem un nou fit.
        setInitialBoundsFitted(false);
    }, [allParcelsFromProps, highlightFarmerId, showAllFarmersColors]); // Adăugăm noile props ca dependențe

    const defaultCenter: LatLngExpression = [47.77, 27.92]; const defaultZoom = 13;

    const MapEventsHandler = () => {
        const map = useMapEvents({ zoomend: () => setCurrentZoom(map.getZoom()), });
        React.useEffect(() => { if (map && !mapRef.current) mapRef.current = map; }, [map]);
        return null;
    };
    const createDimensionMarkerIcon = (text: string) => L.divIcon({ className: 'leaflet-dimension-marker', html: `<div class="bg-background/80 border border-destructive text-destructive px-1 py-0.5 rounded text-xs font-semibold">${text}</div>`, iconSize: [40, 15], iconAnchor: [20, 7] });

    if (!isMounted) return <div className="h-full w-full"><Skeleton className="h-full w-full" /></div>;
    if (!allParcelsFromProps || allParcelsFromProps.length === 0) {
        return ( <Alert variant="default" className="m-4 h-full flex items-center justify-center"> <AlertCircle className="h-4 w-4 mr-2" /> <AlertTitle>Nicio Parcelă</AlertTitle> <AlertDescription>Nu sunt date pentru {village}.</AlertDescription> </Alert> );
    }

    return (
         <div className="relative h-full w-full">
            <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%' }} className='z-0' preferCanvas={true} >
                <DynamicTileLayer mapViewType={mapViewType} />
                <MapEventsHandler />
                {!initialBoundsFitted && parcelsForInitialFit.length > 0 && (
                    <FitBounds parcelsToFit={parcelsForInitialFit} onFitted={() => setInitialBoundsFitted(true)} />
                )}
                {mapRef.current && (
                    <OptimizedParcelRenderer
                        allParcels={allParcelsFromProps} farmers={farmers} map={mapRef.current} currentZoom={currentZoom}
                        selectedParcelId={selectedParcelId} setSelectedParcelId={setSelectedParcelId}
                        setParcelDimensions={setCurrentParcelDimensions}
                        highlightFarmerId={highlightFarmerId} // Pasează prop-ul
                        showAllFarmersColors={showAllFarmersColors} // Pasează prop-ul
                    />
                )}
                {selectedParcelId && currentParcelDimensions.length > 0 && currentParcelDimensions.map((dim: DimensionInfo, index: number) => (
                    <React.Fragment key={`map-dim-${dim.segmentIndex}-${index}`}>
                        <Marker position={dim.midPoint} icon={createDimensionMarkerIcon(`${dim.length}m (S${dim.segmentIndex})`)} />
                    </React.Fragment>
                ))}
            </MapContainer>
            {selectedParcelInfo && currentParcelDimensions.length > 0 && (
                 <Card className="absolute bottom-4 right-4 z-10 w-64 bg-background/90 shadow-lg max-h-[40vh] overflow-y-auto">
                     <CardHeader className="p-3"> <CardTitle className="text-sm flex items-center gap-1"> <Ruler className="h-4 w-4"/> Dimensiuni: {selectedParcelInfo.id} </CardTitle> </CardHeader>
                     <CardContent className="p-3 text-xs space-y-1">
                        <p><strong>Suprafață:</strong> {selectedParcelInfo.area.toFixed(2)} ha</p>
                        {currentParcelDimensions.length > 0 && <p className="font-medium mt-1">Segmente:</p>}
                         <ul className="list-disc pl-4"> {currentParcelDimensions.map((dim: DimensionInfo) => ( <li key={dim.segmentIndex}>S{dim.segmentIndex}: {dim.length} m</li> ))} </ul>
                         <p className="text-muted-foreground text-[10px] mt-2">Clic hartă pt. deselect.</p>
                     </CardContent>
                 </Card>
             )}
        </div>
    );
}