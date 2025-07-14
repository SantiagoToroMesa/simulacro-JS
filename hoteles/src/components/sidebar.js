import { getCurrentUser } from "../services/auth";

export function renderSidebar() {
    const user = getCurrentUser();
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    if (user && user.role === "admin") {
        sidebar.innerHTML = `
            <nav class="sidebar-nav">
                <a href="/dashboard" data-link>Dashboard</a>
                <a href="/courses" data-link>Hoteles</a>
                <a href="/public" data-link>Reservas</a>
            </nav>
        `;
    } else if (user) {
        sidebar.innerHTML = `
            <nav class="sidebar-nav">
                <a href="/courses" data-link>Hoteles</a>
                <a href="/public" data-link>Reservas</a>
            </nav>
        `;
    } else {
        sidebar.innerHTML = "";
    }
}
