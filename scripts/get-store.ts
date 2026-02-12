import { prisma } from "../src/lib/prisma";

async function main() {
  const store = await prisma.store.findFirst();
  if (!store) {
     // Create a default store if none exists
     const newStore = await prisma.store.create({
        data: { name: "Test Store", currency: "EUR" }
     });
     console.log(newStore.id);
  } else {
     console.log(store.id);
  }
}
main();
