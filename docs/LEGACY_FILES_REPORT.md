# Archivos Legacy Encontrados

## src/lib/ai.ts
- **Importado por**:
  - `src/app/marketing/research/language-actions.ts`
  - `src/app/marketing/research/offer-actions.ts`
  - `src/app/marketing/contents/actions.ts`
  - `src/app/marketing/product-brain/actions.ts`
  - `src/app/marketing/post-venta/actions.ts`
  - `src/app/marketing/video-lab/actions.ts`
  - `src/app/marketing/creative-lab/video/actions.ts`
  - `src/app/marketing/creative-lab/blueprints/actions.ts`
  - `src/app/marketing/creative-lab/statics/actions.ts`
  - `src/app/marketing/creative-lab/landings/optimizer-actions.ts`
  - `src/app/marketing/creative-lab/landings/actions.ts`
  - `src/app/marketing/creative-lab/recycle/actions.ts`
  - `src/app/marketing/creative-lab/articles/actions.ts`
  - `src/app/marketing/creative-lab/speed-flows/actions.ts`
  - `src/app/marketing/creative-lab/quality-gate/actions.ts`
  - `src/app/marketing/creative-lab/videos/actions.ts`
  - `src/app/marketing/static-ads/actions.ts`
  - `src/app/marketing/offer-os/actions.ts`
  - `src/app/finances/ai-optimizer/actions.ts`
  - `src/lib/handlers/ai-extract.ts`
- **Usado para**: Función `askGemini`.
- **Estado**: **CRÍTICO**. No se puede mover a /legacy sin romper gran parte de la lógica de marketing.
- **Acción recomendada**: Migrar estas llamadas a `AiRouter.dispatch` o crear un adapter en `src/lib/ai/router.ts` que emule `askGemini`.

## src/lib/gemini.ts
- **Importado por**:
  - `src/lib/services/media-buyer-service.ts`
- **Usado para**: Clase `GeminiService`.
- **Estado**: **CRÍTICO**. Usado en el servicio de Media Buyer.
- **Acción recomendada**: Migrar el servicio a usar el nuevo `AiRouter` o el proveedor estandarizado.
