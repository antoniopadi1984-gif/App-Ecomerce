import { getProducts } from "./actions";
import VideoLabClient from "./VideoLabClient";

export default async function VideoLabPage() {
    // Fetch products on the server
    const productsRes = await getProducts();
    const products = productsRes.success && productsRes.products ? productsRes.products : [];

    return <VideoLabClient initialProducts={products} />;
}
