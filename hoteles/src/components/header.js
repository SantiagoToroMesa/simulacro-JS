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
        <h1>course and registration system</h1>
        </div>
        <nav>
            <span>¡Hello, ${session.name}!</span>
            <span>you're ${session.role}</span>
        </nav>
        <button id="logoutButton">Logout</button>
    `;
    document.getElementById("logoutButton").addEventListener("click", (e) => {
        e.preventDefault();
        logout();
        navigate("/");
    });
}