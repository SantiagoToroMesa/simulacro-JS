import {get, post} from "./api";
import {navigate} from "../main";
export function setupLogin() {
    const form = document.getElementById("login-form");
    const msg = document.getElementById("login-msg");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        const users = await get("http://localhost:3000/users");

        const found = users.find(
            user => user.email === email && user.password === password
        );

        if (found) {
            localStorage.setItem("user", JSON.stringify(found));
            navigate("/dashboard");
        } else {
            msg.textContent = "Correo o contraseña incorrectos";
        }
    });
}
export function isAdmin() {
    const user = getCurrentUser();
    return user?.role === "admin";
}

export function getCurrentUser() {
    return JSON.parse(localStorage.getItem("user"));
}
export function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("loggedUser");
    navigate("/");
}
