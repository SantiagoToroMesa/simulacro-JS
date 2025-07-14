//sesion para importar los modulos
import {setupLogin} from "./services/auth";
import { get,post,deletes,update} from "./services/api";
import {setupRegister} from "./services/register";
import {isAdmin} from "./services/auth";
import { renderHeader } from "./components/header";
import { renderSidebar } from "./components/sidebar";
import {getDashboardData} from "./services/dashboard";

const routes = {
    "/": "src/pages/login.html",
    "/dashboard": "src/pages/dashboard.html",
    "/register": "src/pages/register.html",
    "/public": "src/pages/public.html",
    "/courses": "src/pages/events.html",
    // Agrega más rutas aquí si creas más páginas
};

document.body.addEventListener("click", (e) => {
    if (e.target.matches("[data-link]")) {
        e.preventDefault();
        navigate(e.target.getAttribute("href"));
    }
});

// Mostrar productos en public según el usuario
async function renderPublicProducts() {
    const container = document.getElementById("public-courses-container");
    if (!container) return;
    container.innerHTML = "Cargando productos...";
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        container.innerHTML = "Debes iniciar sesión para ver los productos.";
        return;
    }
    const [products, purchases] = await Promise.all([
        get("http://localhost:3000/products"),
        get("http://localhost:3000/purchases")
    ]);
    let html = "";
    if (user.role === "user") {
        // Filtra las compras del usuario actual.
        const myPurchases = purchases.filter(p => p.userId === user.id);
        if (myPurchases.length === 0) {
            html = "<p>No has comprado ningún producto.</p>";
        } else {
            html = "<h3>Mi historial de compras:</h3><table border='1'><thead><tr><th>Producto</th><th>Cantidad</th><th>Total</th><th>Fecha</th></tr></thead><tbody>";
            myPurchases.forEach(purchase => {
                const prod = products.find(prod => prod.id === purchase.productId);
                const total = prod ? (prod.price * purchase.quantity) : 0;
                const fecha = purchase.date || '-';
                html += `<tr><td>${prod ? prod.name : 'Producto eliminado'}</td><td>${purchase.quantity}</td><td>$${total}</td><td>${fecha}</td></tr>`;
            });
            html += "</tbody></table>";
        }
        // Mostrar todos los productos disponibles para comprar
        html += "<h3>Todos los productos disponibles:</h3><ul>";
        products.forEach(prod => {
            html += `<li><button style=\"background:none;border:none;color:blue;cursor:pointer;text-decoration:underline\" onclick=\"verDetalleProducto('${prod.id}')\">${prod.name}</button> - ${prod.description} | Precio: $${prod.price} | Stock: ${prod.stock} <button onclick=\"comprarProducto('${prod.id}')\">Comprar</button></li>`;
        });
        html += "</ul>";
    } else if (user.role === "admin") {
        html = "<h3>Todos los productos y usuarios que compraron:</h3>";
        products.forEach(prod => {
            html += `<div style='margin-bottom:1em'><strong>${prod.name}</strong> - ${prod.description}<br><em>Usuarios que compraron:</em><ul>`;
            const productPurchases = purchases.filter(p => p.productId === prod.id);
            if (productPurchases.length === 0) {
                html += "<li>Nadie ha comprado</li>";
            } else {
                productPurchases.forEach(p => {
                    html += `<li>Usuario ID: ${p.userId} (Cantidad: ${p.quantity})</li>`;
                });
            }
            html += "</ul></div>";
        });
    }
    container.innerHTML = html;
}

export async function navigate(pathname) {
    history.pushState({}, "", pathname);
    const route = routes[pathname];
    let user = JSON.parse(localStorage.getItem("user"));
    const app = document.getElementById("app");
    const loginContainer = document.getElementById("loginContainer");
    const header = document.getElementById("header");
    const sidebar = document.getElementById("sidebar");
    const content = document.getElementById("content");

    // --- Protección de rutas: Solo usuarios autenticados pueden acceder a rutas privadas ---
    const privateRoutes = ["/dashboard", "/courses", "/index"];
    if (privateRoutes.includes(pathname)) {
        if (!user) {
            // Si no hay usuario logueado, redirige al login
            navigate("/");
            return;
        }
    }
    // --- Protección de rutas: Solo admin puede acceder a dashboard ---
    if (pathname === "/dashboard" && user && user.role !== "admin") {
        // Si el usuario no es admin, redirige a la vista pública de cursos
        navigate("/courses");
        return;
    }
    // Redirección automática después de login
    if (pathname === "/" && user) {
        if (user.role === "admin") {
            navigate("/dashboard");
            return;
        } else {
            navigate("/courses");
            return;
        }
    }

    if (pathname === "/" || pathname === "/register") {
        if (app) app.style.display = "none";
        if (header) header.style.display = "none";
        if (loginContainer) {
            loginContainer.style.display = "";
            loginContainer.innerHTML = await fetch(route).then(res => res.text());
            if (pathname === "/") setupLogin();
            if (pathname === "/register") setupRegister();
        }
        if (header) header.innerHTML = "";
        if (sidebar) sidebar.innerHTML = "";
    } else {
        if (app) app.style.display = "";
        if (loginContainer) {
            loginContainer.style.display = "none";
            loginContainer.innerHTML = "";
        }
        if (header) {
            header.style.display = "";
            renderHeader(user);
        }
        if (sidebar) {
            sidebar.innerHTML = "";
            renderSidebar();
        }
        if (content) {
            content.innerHTML = await fetch(route).then(res => res.text());
            renderHeader(user);
            if (pathname === "/public") {
                renderPublicProducts();
            }
            if (pathname === "/dashboard") {
                getDashboardData();
            }
            if (pathname === "/courses") {
                getDashboardData();
            }
            if (pathname === "/register") {
                setupRegister();
            }
        }
    }
}

window.addEventListener("popstate", () => {
    navigate(location.pathname);
});

// Cargar la ruta actual al iniciar la app
navigate(location.pathname);

window.comprarProducto = async function(productId) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Debes iniciar sesión para comprar.");
        return;
    }
    const cantidad = prompt("¿Cuántas unidades deseas comprar?");
    if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
        alert("Cantidad inválida.");
        return;
    }
    try {
        await import('./services/enrollment').then(mod => mod.buyProduct(productId, Number(cantidad)));
        alert("¡Compra realizada con éxito!");
        renderPublicProducts();
    } catch (e) {
        alert("Error al comprar: " + e.message);
    }
}

window.verDetalleProducto = async function(productId) {
    const products = await get("http://localhost:3000/products");
    const product = products.find(p => p.id === productId);
    if (!product) return;
    Swal.fire({
        title: product.name,
        html: `<p><strong>Descripción:</strong> ${product.description}</p>
               <p><strong>Precio:</strong> $${product.price}</p>
               <p><strong>Stock:</strong> ${product.stock}</p>`
    });
}
