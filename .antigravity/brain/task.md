# Task: Phase 8 - Expert Knowledge Graph & Video Engine

## Level 1: Memory Graph & Maturity
- [x] Update Schema for `KnowledgeNode`, `KnowledgeLink`, and `ProductMaturity`
- [x] Implement `getMemoryGraph` server action (fetching interconnected data)
- [x] Implement `calculateMaturityScore` logic
- [x] UI: Add "Knowledge Brain" tab in Product Lab
- [x] UI: Add Maturity Signal (Traffic Light) in Product List

## Level 2 & 3: Copy Reasoning & Anti-Fatigue
- [x] Update `CopyContract` to include `reasoning` and `justification`
- [x] Implement `detectAngleFatigue` logic (checking repetition and saturation)
- [x] UI: Display "Copy Decisions" block in Creative Lab

## Level 4: Video OS (Extreme)
- [x] Implement Video Ingestor (Metadata Cleanup + STT + Segment Detection)
- [x] Implement Clip Library (Hook/Body/CTA segments)
- [x] Implement Script-to-Video Engine (FFmpeg orchestrator simulation)
- [x] Implement "Semi-Avatar" logic (Simulated assembly)
- [x] UI: "Video Studio" with Hook Bank and Multi-Variation generator

## Level 5 & 6: Clowdbot & Post-Venta
- [x] Implement `AgentKPI` tracking (confirmations, deliveries, revenue assisted)
- [x] Implement `AgentCorrection` system (Self-learning from manual corrections)
- [x] Implement Risk-Based Content logic for COD delivery optimization
- [x] UI: Clowdbot Dashboard with "Human vs AI" performance comparison

## Level 7: Language Mirror & "Why NOT Buy"
- [x] Integrate VOC-to-Copy Language Mirror automatically
- [x] Implement "Honesty Section" (Why NOT Buy) generator
- [x] UI: Add "Truth & Objections" simulation in Landing Lab

## Level 8: Cloud Sync (Git/GitHub)
- [x] Setup Local Git Repository
- [x] Refine `.gitignore` for multi-device safety
- [x] Connect to GitHub Private Stream

## Fixes & Polish
- [x] Fix 'undefined' match error in AI Researcher
- [x] Premium Redesign of Product Selector (max-height, indigo-glass style)
- [x] Renamed 'Avatar Lab' back in sidebar (User Preference)
- [x] Fix script editor syntax error ("Broadway")
- [x] Fix UI blocking (pointer-events: none)
- [x] Fix button contrast and visibility (Static Ads & Generation Config)
- [x] Configure Gemini API Key securely
- [/] Static Ads Engine Evolution
    [ ] Implement Landing Page analysis via Gemini
    [ ] Add support for 10 variations in preview panel
    [ ] Enhance Envato integration for image references
    [ ] Create batch generation logic for static images
- [x] UI Density Optimization (Phase 2): Compacted empty states and control card
- [x] Fixed Button Text Overflow (Sintetizar Video)
- [x] Fixed Video Extraction & Background Worker (Global Root Input)
- [x] UI Premium Polish: Static Ads redesign & Gen Config buttons
- [x] Fix Script Editor syntax error
- [x] System Stabilization & DB Optimization
    - [x] Offload large payloads (Base64) to filesystem in `createJob`
    - [x] Support `file://` references in `AI_EXTRACT` handler
    - [x] Install `uuid` for unique job file naming
    - [x] Add explicit `dotenv` loading in `ai.ts` and `prisma.ts`
    - [x] Perform SQLite `VACUUM` to reduce 315MB DB size (now 154MB)
    - [x] Fix `.gitignore` to exclude `venv/` from IDE indexing (Prevents Crashes)
