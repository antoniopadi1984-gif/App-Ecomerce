import { prisma } from "../src/lib/prisma";
import { 
  createMaestroProject, 
  ingestVideoAsset, 
  analyzeVideoAsset, 
  generateMaestroScripts 
} from "../src/app/marketing/maestro/actions";

async function main() {
  // 1. Get Product
  const product = await prisma.product.findFirst();
  if (!product) throw new Error("No product found");

  console.log("1. Creating Project for", product.title);
  const project = await createMaestroProject({
    name: "Pipeline Verify Project",
    productId: product.id,
    platform: "TIKTOK",
    language: "ES"
  });
  console.log("Project Created:", project.id);

  // 2. Ingest
  console.log("2. Ingesting Video...");
  const asset = await ingestVideoAsset(project.id, "test_video.mp4", "video/mp4");
  console.log("Asset Created:", asset.id, asset.status);

  // 3. Analyze
  console.log("3. Analyzing Video...");
  await analyzeVideoAsset(asset.id);
  const analyzedAsset = await prisma.maestroAsset.findUnique({
    where: { id: asset.id },
    include: { clips: true }
  });
  console.log("Analysis Complete. Status:", analyzedAsset?.status);
  console.log("Clips Found:", analyzedAsset?.clips.length);

  // 4. Generate Script
  console.log("4. Generating Script...");
  await generateMaestroScripts(project.id, "Context from clips");
  const scripts = await prisma.maestroScript.findMany({ where: { projectId: project.id } });
  console.log("Scripts Generated:", scripts.length);
  console.log("First Script Preview:", scripts[0]?.content.substring(0, 50) + "...");
}

main();
