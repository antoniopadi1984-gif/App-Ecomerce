
import { createClient } from "@libsql/client";
import path from "path";

async function inspect() {
    const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
    const url = `file:${dbPath}`;
    const client: any = createClient({ url });

    console.log("Client Keys:", Object.keys(client));
    console.log("Client Config:", client._config || client.config || "not found");
}

inspect();
