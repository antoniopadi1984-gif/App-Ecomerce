# Audit of Creative Lab

## Current Modules Overview

The Creative Lab is organized into specialized directories under `/app/marketing/creative-lab/`. Below is the status of each identified module:

### 1. Video Modules (Redundancy Detected)
*   **`/video`**: Primarily focused on **Video Ingestion** (from URLs), **Segmentation** (into clips), and **Assembly** using FFmpeg.
*   **`/videos`**: Focused on **Video Dissection** (AI analysis of hooks/structure) and **Variation Generation**.
*   > [!IMPORTANT]
    > These two folders should be unified into a single `VideoStudio` to avoid developer confusion and fragmented workflows.

### 2. Landing Lab
*   **`/landings`**: Implements landing page cloning and block optimization. It integrates with a `BlueprintManager` to store successful structures.
*   **Status**: Mature, but could benefit from deeper integration with the `landing-creator` agent.

### 3. Static Ads Lab
*   **`/statics`**: Handles generation of static ad packs based on research angles. Includes a "Friction Scanner" for landing pages.
*   **Status**: Functional. Currently uses generic styling; integration with `Flux` (Replicate) for product backgrounds is highly recommended.

### 4. Shared Infrastructure
*   **`/blueprints`**: Central repository for creative structures (JSON-based "contracts").
*   **`/quality-gate`**: UI for auditing generated assets against brand guidelines.
*   **`/recycle`**: Logic for iterative improvement of creatives based on feedback.

---

## Technical Debt & Integration Gaps

1.  **Replicate Integration**: Currently, video generation is fragmented. A centralized `VideoGenerator` (`/lib/creative/video-generator.ts`) has been created but needs to be wired into the `VideoStudio` UI.
2.  **Research to Creative Pipeline**: The bridge `ResearchToCreative` exists but is not fully utilized by the UI components, which still rely on older, less specialized agents.
3.  **Directory Structure**: The existence of both `/video` and `/videos` creates confusion.

## Recommendations

1.  **Unify Video Modules**: Merge `/videos` into `/video` (or a common `/video-lab`).
2.  **Agent Migration**: Update all Creative Lab actions to use the new `agentDispatcher` tiers (e.g., `copywriter-elite` for statics, `script-generator` for video).
3.  **Automation**: Automate the generation of 10-15 variations using the batch methods provided in `VideoGenerator`.
