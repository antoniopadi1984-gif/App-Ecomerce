export async function updateProduct(id: string, data: any) {
    const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al actualizar el producto");
    }
    return res.json();
}
