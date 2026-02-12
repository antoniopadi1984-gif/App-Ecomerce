# Static Ads Engine Evolution

The goal is to transform the Static Ads tab into a powerful creative engine that can analyze landing pages, use references from Envato, and generate up to 10 image variations for different marketing angles.

## Proposed Changes

### [Marketing] Avatars Lab Component [`page.tsx`](file:///Users/padi/APPs%20Propias/App%20Ecomerce/src/app/marketing/avatars-lab/page.tsx)

- **New States**:
  - `landingUrl`: For analyzing external products.
  - `staticVariations`: Array to store the 10 generated results.
  - `activeVariation`: Selected variation to preview.
- **UI Updates**:
  - Add a "Landing Page Analysis" section in the Static tab.
  - Implement a grid/carousel to browse the 10 variations in the preview panel.
  - Improve Envato integration to be usable as a "Base Reference" for image generation.
- **Logic Updates**:
  - `handleGenerate`: Branch logic to call `generateStaticAds` when in the static tab.
  - `handleLandingAnalysis`: New function to scrape/analyze URLs via Gemini.

### [System] Backend Actions [`actions.ts`](file:///Users/padi/APPs%20Propias/App%20Ecomerce/src/app/marketing/avatars-lab/actions.ts)

- **New Action**: `analyzeLandingCreative(url: string)`: Uses Gemini to extract visual style, product benefits, and copy from a URL.
- **Enhanced Action**: `generateStaticVariations(config: any)`: Triggers a batch job to create multiple image variations.

## Verification Plan

### Automated Tests
- Verification of landing page analysis via internal logs.
- Validation of UI responsiveness with 10 variations loaded.

### Manual Verification
1. Enter a Landing Page URL and verify Gemini extracts the brand context.
2. Select a reference image from Envato.
3. Generate variations and navigate through the 10 results.
