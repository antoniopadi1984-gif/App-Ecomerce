import { prisma } from "@/lib/prisma";
import VideoLabClient from "./VideoLabClient";

export default async function VideoLabPage() {
    const products = await prisma.product.findMany({
        select: {
            id: true,
            title: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return <VideoLabClient initialProducts={products} />;
}
