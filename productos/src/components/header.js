import { getCurrentUser, logout } from "../services/auth";
import { navigate } from "../main";

export function renderHeader() {
    const session = getCurrentUser();
    const header = document.getElementById("header");
    if (!session) {
        header.innerHTML = "";
        return;
    }
    header.innerHTML = `
        <div class="logo">
        <h1>Sistema de Compras y Productos</h1>
        </div>
        <nav>
            <span>¡Hola, ${session.name}!</span>
            <span>Rol: ${session.role}</span>
            ${session.role === "admin" ? `
                <button id="addProductNavBtn">Agregar Producto</button>
                <button id="addPurchaseNavBtn">Agregar Compra</button>
            ` : ""}
        </nav>
        <button id="logoutButton">Logout</button>
    `;
    document.getElementById("logoutButton").addEventListener("click", (e) => {
        e.preventDefault();
        logout();
        navigate("/");
    });
    if (session.role === "admin") {
        document.getElementById("addProductNavBtn").addEventListener("click", () => navigate("/dashboard"));
        document.getElementById("addPurchaseNavBtn").addEventListener("click", () => navigate("/dashboard"));
    }
}