import { prisma } from "../src/lib/prisma";
import { generateAvatarStaticImage } from "../src/app/marketing/maestro/actions";

async function main() {
  console.log("Creating test avatar profile...");
  const profile = await prisma.avatarProfile.create({
    data: {
      storeId: "cml6ztebw000026dpuif9xsoi",
      name: "Test Avatar Verification",
      sex: "FEMALE",
      status: "DRAFT"
    }
  });

  console.log("Profile created:", profile.id);
  console.log("Triggering generation...");

  const result = await generateAvatarStaticImage(profile.id);
  console.log("Generation Result:", result);

  const updated = await prisma.avatarProfile.findUnique({ where: { id: profile.id } });
  console.log("Updated Profile Image:", updated?.imageUrl);
  
  const asset = await prisma.avatarAsset.findFirst({ where: { avatarProfileId: profile.id } });
  console.log("Created Asset Path:", asset?.pathLocal);
}

main();
