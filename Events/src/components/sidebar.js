import { getCurrentUser } from "../services/auth";

export function renderSidebar() {
    const user = getCurrentUser();
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    if (user && user.role === "admin") {
        sidebar.innerHTML = `
            <nav class="sidebar-nav">
                <a href="/dashboard" data-link>add events</a>
                <a href="/events" data-link>logged events</a>
                <a href="/admin-reservas" data-link>reservations</a>
            </nav>
        `;
    } else if (user) {
        sidebar.innerHTML = `
            <nav class="sidebar-nav">
                <a href="/events" data-link>Events</a>
                <a href="/public" data-link>My reservations</a>
            </nav>
        `;
    } else {
        sidebar.innerHTML = "";
    }
}
