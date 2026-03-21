export const CONCEPTS = {
  C1: { name: "Problema",       funnel: ["COLD"],         awareness: [1,2] },
  C2: { name: "ANTES_DESPUES", funnel: ["COLD","WARM"],  awareness: [2,3] },
  C3: { name: "Mecanismo",      funnel: ["WARM"],          awareness: [3] },
  C4: { name: "Prueba",         funnel: ["WARM","HOT"],   awareness: [3,4] },
  C5: { name: "Autoridad",      funnel: ["WARM","HOT"],   awareness: [4] },
  C6: { name: "Historia",       funnel: ["COLD","WARM"],  awareness: [1,2,3] },
  C7: { name: "Identidad",      funnel: ["HOT"],           awareness: [4,5] },
  C8: { name: "Resultado",      funnel: ["HOT"],           awareness: [4,5] },
  C9: { name: "Oferta",         funnel: ["HOT"],           awareness: [5] },
} as const;

export type ConceptCode = keyof typeof CONCEPTS;
export type FunnelStage = "COLD"|"WARM"|"HOT";
export type VideoType = "UGC"|"STATIC"|"AVATAR"|"MONTAJE"|"VSL"|"HOOK"|"TESTIMONIAL";

export function generateNomenclature(input: {
  productTitle: string; productSku?: string;
  concept: ConceptCode; funnelStage: FunnelStage;
  videoType: VideoType; version?: number;
  language?: string; extension?: string;
}): string {
  const sku = (input.productSku || input.productTitle.replace(/[^a-zA-Z]/g,"").slice(0,4)).toUpperCase();
  const lang = input.language && input.language !== "ES" ? `_${input.language.toUpperCase()}` : "";
  return `${sku}-${input.concept}-${input.funnelStage}-${input.videoType}${lang}-V${input.version||1}.${input.extension||"mp4"}`;
}

export function getDrivePath(concept: ConceptCode, funnelStage: FunnelStage, videoType: VideoType): string {
  const awareness = CONCEPTS[concept].awareness[0];
  const aMap: Record<number,string> = { 1:"1_Unaware", 2:"2_Problem_Aware", 3:"3_Solution_Aware", 4:"4_Product_Aware", 5:"5_Most_Aware" };
  return `${concept}_${CONCEPTS[concept].name}/${funnelStage}/${aMap[awareness]||"1_Unaware"}`;
}

export function inferConcept(analysis: { hook?:string; approach?:string; mainMessage?:string; concept?:string }): ConceptCode {
  const t = Object.values(analysis).filter(Boolean).join(" ").toLowerCase();
  if (t.includes("problema")||t.includes("dolor")||t.includes("problem")) return "C1";
  if (t.includes("falsa")||t.includes("pensaba")||t.includes("creia")) return "C2";
  if (t.includes("mecanismo")||t.includes("como funciona")||t.includes("ingrediente")) return "C3";
  if (t.includes("prueba")||t.includes("estudio")||t.includes("clinico")) return "C4";
  if (t.includes("autoridad")||t.includes("experto")||t.includes("doctor")) return "C5";
  if (t.includes("historia")||t.includes("mi caso")||t.includes("cuando yo")) return "C6";
  if (t.includes("identidad")||t.includes("personas como")) return "C7";
  if (t.includes("resultado")||t.includes("antes")||t.includes("consegui")) return "C8";
  if (t.includes("oferta")||t.includes("descuento")||t.includes("precio")) return "C9";
  return "C1";
}

export function inferFunnelStage(awareness: number): FunnelStage {
  if (awareness <= 2) return "COLD";
  if (awareness <= 4) return "WARM";
  return "HOT";
}
