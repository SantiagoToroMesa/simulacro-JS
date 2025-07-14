import { get, post, update } from "./api";

export async function buyProduct(productId, quantity) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) throw new Error("Usuario no autenticado");
    const products = await get("http://localhost:3000/products");
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error("Producto no encontrado");
    if (product.stock < quantity) throw new Error("Stock insuficiente");
    // Registrar la compra con fecha
    await post("http://localhost:3000/purchases", {
        userId: user.id,
        productId,
        quantity,
        date: new Date().toLocaleString()
    });
    // Actualizar el stock del producto
    await update("http://localhost:3000/products", productId, { stock: product.stock - quantity });
}