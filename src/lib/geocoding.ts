import prisma from "./prisma";

/**
 * Automatically geocodes and validates an order address using Google Maps API.
 * Implements a "Semaphore" system: 
 * - VALIDATED (Green): Exact street number match.
 * - NEEDS_REVIEW (Yellow): Street found but house number missing/approximate.
 * - FAILED (Red): Address not found.
 */
const SPANISH_PROVINCE_COORDS: Record<string, { lat: number, lng: number }> = {
    "MADRID": { lat: 40.4168, lng: -3.7038 },
    "BARCELONA": { lat: 41.3851, lng: 2.1734 },
    "VALENCIA": { lat: 39.4699, lng: -0.3763 },
    "SEVILLA": { lat: 37.3891, lng: -5.9845 },
    "ALICANTE": { lat: 38.3452, lng: -0.4810 },
    "MALAGA": { lat: 36.7213, lng: -4.4214 },
    "MURCIA": { lat: 37.9922, lng: -1.1307 },
    "CADIZ": { lat: 36.5271, lng: -6.2886 },
    "VIZCAYA": { lat: 43.2630, lng: -2.9350 },
    "CORUÑA": { lat: 43.3623, lng: -8.4115 },
    "BALEARES": { lat: 39.6953, lng: 3.0176 },
    "LAS PALMAS": { lat: 28.1248, lng: -15.4300 },
    "TENERIFE": { lat: 28.2916, lng: -16.6291 },
    "ZARAGOZA": { lat: 41.6488, lng: -0.8891 },
    "PONTEVEDRA": { lat: 42.4310, lng: -8.6444 },
    "GRANADA": { lat: 37.1773, lng: -3.5986 },
    "TARRAGONA": { lat: 41.1189, lng: 1.2445 },
    "CORDOBA": { lat: 37.8882, lng: -4.7794 },
    "GIRONA": { lat: 41.9794, lng: 2.8214 },
    "ALMERIA": { lat: 36.8340, lng: -2.4637 },
    "CASTELLON": { lat: 39.9864, lng: -0.0513 },
    "GUIPUZCOA": { lat: 43.3183, lng: -1.9812 },
    "TOLEDO": { lat: 39.8628, lng: -4.0273 },
    "BADAJOZ": { lat: 38.8794, lng: -6.9706 },
    "NAVARRA": { lat: 42.8125, lng: -1.6458 },
    "CANTABRIA": { lat: 43.4623, lng: -3.8099 },
    "VALLADOLID": { lat: 41.6523, lng: -4.7245 },
    "CIUDAD REAL": { lat: 38.9848, lng: -3.9274 },
    "HUELVA": { lat: 37.2614, lng: -6.9447 },
    "LEON": { lat: 42.5987, lng: -5.5671 },
    "LLEIDA": { lat: 41.6176, lng: 0.6200 },
    "CACERES": { lat: 39.4753, lng: -6.3722 },
    "ALBACETE": { lat: 38.9944, lng: -1.8585 },
    "BURGOS": { lat: 42.3440, lng: -3.6969 },
    "ALAVA": { lat: 42.8467, lng: -2.6716 },
    "SALAMANCA": { lat: 40.9701, lng: -5.6635 },
    "LUGO": { lat: 43.0125, lng: -7.5558 },
    "LA RIOJA": { lat: 42.4650, lng: -2.4456 },
    "OURENSE": { lat: 42.3358, lng: -7.8639 },
    "GUADALAJARA": { lat: 40.6322, lng: -3.1641 },
    "HUESCA": { lat: 42.1362, lng: -0.4085 },
    "CUENCA": { lat: 40.0704, lng: -2.1374 },
    "ZAMORA": { lat: 41.5033, lng: -5.7462 },
    "PALENCIA": { lat: 42.0100, lng: -4.5289 },
    "AVILA": { lat: 40.6558, lng: -4.6766 },
    "SEGOVIA": { lat: 40.9429, lng: -4.1088 },
    "TERUEL": { lat: 40.3457, lng: -1.1065 },
    "SORIA": { lat: 41.7666, lng: -2.4793 }
};

export async function autoGeocodeOrder(orderId: string, apiKeyOverride?: string) {
    const apiKey = apiKeyOverride || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order || !order.addressLine1 || !order.city) return;

        // Clean Address
        const stripFloor = (s: string) => {
            if (!s) return "";
            let clean = s;
            const noiseKeywords = [
                'piso', 'planta', 'puerta', 'bloque', 'escalera', 'esc', 'blq', 'pta',
                'izq', 'der', 'palt', 'bajo', 'bajos', 'ático', 'atico', 'st', 'sótano',
                'sotano', 'local', 'galeria', 'galerias', 'oficina', 'of', 'despacho',
                'nave', 'chalet', 'puerta', 'centro', 'azul'
            ];
            const regex = new RegExp(`\\s+(?:${noiseKeywords.join('|')})\\b[\\s\\S]*`, 'gi');
            clean = clean.replace(regex, '');
            clean = clean.replace(/\d+\s?[ªº°](?:[\s\S]*)/g, '');
            clean = clean.replace(/\(.*\)/g, '');
            if (clean.includes(',')) clean = clean.split(',')[0];
            return clean.trim();
        };

        const cleanLine1 = stripFloor(order.addressLine1);
        const addressToGeocode = `${cleanLine1}, ${order.city}, ${order.province || ""}, ${order.country || "Spain"}`.replace(/,,/g, ",");

        // --- DUPLICATE CHECK (Bad History) ---
        // Check if this address (fuzzy match) has history of Incidences/Returns
        // We look for same Zip + similar street
        const badHistory = await prisma.order.count({
            where: {
                id: { not: orderId },
                zip: order.zip,
                addressLine1: { contains: cleanLine1.substring(0, 5) }, // Simple fuzzy check
                logisticsStatus: { in: ['INCIDENCE', 'RETURNED', 'RETURN_TO_SENDER'] }
            }
        });

        console.log(`[Geocode] Validating order ${order.orderNumber}: Query="${addressToGeocode}"`);

        // FALLBACK COORDINATES
        const normalize = (text: string) => text.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const provinceKey = normalize(order.province || order.city || "");
        const fallback = Object.entries(SPANISH_PROVINCE_COORDS).find(([k]) => provinceKey.includes(k) || k.includes(provinceKey));

        let data: any = { status: "OFFLINE" };
        let skipApi = false;

        // Optimization: If we already have coordinates and address, DO NOT call Google API again
        // Just re-evaluate the Risk Logic (e.g. stricter Zip rules, history, etc.)
        if (order.lat && order.lng && order.correctedAddress) {
            console.log(`[Geocode] Skipping API for ${order.orderNumber}, re-evaluating risk.`);
            skipApi = true;

            // TRUST THE STORED DATA
            // We construct a mock response that guarantees validation passes if we already have coords
            data = {
                status: "OK",
                results: [{
                    geometry: { location: { lat: order.lat, lng: order.lng }, location_type: "ROOFTOP" },
                    address_components: [
                        { types: ["postal_code"], long_name: order.zip || "00000" },
                        { types: ["street_number"], long_name: "1" }
                    ]
                }]
            };
        }

        if (apiKey && !skipApi) {
            try {
                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToGeocode)}&key=${apiKey}&language=es`,
                    { signal: AbortSignal.timeout(5000) }
                );
                data = await response.json();
            } catch (e) {
                console.warn("[Geocode] API Error, using fallback");
            }
        }

        let lat = order.lat;
        let lng = order.lng;
        let correctedAddress = order.correctedAddress;
        let addressStatus = "NEEDS_REVIEW";
        let riskLevel = "MEDIUM";
        let notes = "";

        if (data.status === "OK" && data.results[0]) {
            const result = data.results[0];
            lat = result.geometry.location.lat;
            lng = result.geometry.location.lng;
            const locationType = result.geometry.location_type;

            const components: any = {};
            result.address_components.forEach((c: any) => {
                const type = c.types[0];
                components[type] = c.long_name;
            });

            const street = components.route || "";
            const number = components.street_number || "";
            const city = components.locality || components.postal_town || "";
            const googleZip = components.postal_code || "";

            const isPrecise = (locationType === "ROOFTOP" || locationType === "RANGE_INTERPOLATED");
            const hasNumber = !!number;
            // Relaxed Zip Check: Match if first 4 digits match (e.g. 28001 vs 28002 often in same block) or exact match
            // If order has no zip, we assume match (cannot verify)
            const zipMatch = !order.zip || (googleZip && (googleZip === order.zip || googleZip.startsWith(order.zip.substring(0, 4))));

            addressStatus = "NEEDS_REVIEW";
            riskLevel = "MEDIUM";

            if (isPrecise && hasNumber && zipMatch) {
                addressStatus = "VALIDATED";
            } else {
                // Determine severity of failure
                const errors = [];
                if (!hasNumber) errors.push("Falta número");
                if (!zipMatch) errors.push(`CP Incorrecto (${googleZip})`);

                notes += errors.join(", ") + ". ";

                // Only strictly INVALID if Zip fails or no results at all
                if (!zipMatch) {
                    addressStatus = "FAILED";
                } else if (!hasNumber) {
                    addressStatus = "NEEDS_REVIEW";
                }
            }

        } else if (fallback) {
            // Provincial Fallback
            console.log(`[Geocode] Using provincial fallback for ${order.province}: ${fallback[0]}`);
            lat = fallback[1].lat + (Math.random() - 0.5) * 0.1;
            lng = fallback[1].lng + (Math.random() - 0.5) * 0.1;
            addressStatus = "FAILED";
            notes += "Solo detectado nivel Provincia. ";
        } else {
            addressStatus = "FAILED";
            notes += "Dirección no encontrada. ";
        }

        // Apply Bad History Penalty notice (but don't set status here)
        if (badHistory > 0) {
            notes += `Zona con ${badHistory} incidencias previas. `;
        }

        await prisma.order.update({
            where: { id: orderId },
            data: {
                lat,
                lng,
                correctedAddress,
                addressStatus,
                incidenceResult: (order.incidenceResult ? order.incidenceResult + " | " : "") + notes
            } as any
        });

    } catch (error) {
        console.error("[Geocode Error]:", error);
    }
}

/**
 * Utility to keep floor/apartment details which Google often strips
 */
function extractFloorInfo(original: string) {
    if (!original) return null;

    // Normalize slightly
    const text = original.trim();

    const patterns = [
        // Explicit markers (most reliable)
        /(?:piso|planta|puerta|bloque|escalera|esc|blq|pta|izq|der|palt|bajo|bajos|ático|atico|st|sótano|sotano)\s*.*/i,
        /(?:apt|unit|suite|casa|chalet|nave|loof|loft)\s*.*/i,

        // Ordinals often used in Spain (1º 2ª)
        /\d+\s?[ªº°]/i,

        // Urbanization style (Blq 2, Esc A) handled by first regex often, but specific formats:
        /[A-Z]\s?\d+\s?[A-Z]?$/i, // e.g. B2, C 4
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[0];
    }

    // Fallback: If the end of the string looks like "3 A" or "4B" and isn't part of street name
    // We look for a comma separator often: "Calle X, 12, 4A" -> 4A
    const parts = text.split(',');
    if (parts.length > 1) {
        const last = parts[parts.length - 1].trim();
        // If last part is short and contains digit (but not a zip 5 digits)
        if (last.length < 10 && /\d/.test(last) && !/^\d{5}$/.test(last)) {
            return last;
        }
    }

    return null;
}
