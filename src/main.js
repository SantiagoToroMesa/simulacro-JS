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
    "/courses": "src/pages/courses.html",
    // Agrega más rutas aquí si creas más páginas
};

document.body.addEventListener("click", (e) => {
    if (e.target.matches("[data-link]")) {
        e.preventDefault();
        navigate(e.target.getAttribute("href"));
    }
});

// Mostrar cursos en public según el usuario
async function renderPublicCourses() {
    const container = document.getElementById("public-courses-container");
    if (!container) return;
    container.innerHTML = "Cargando cursos...";
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        container.innerHTML = "Debes iniciar sesión para ver los cursos.";
        return;
    }
    const [courses, enrollments, users] = await Promise.all([
        get("http://localhost:3000/courses"),
        get("http://localhost:3000/enrollments"),
        get("http://localhost:3000/users")
    ]);
    let html = "";
    if (user.role === "user") {
        // Cursos en los que está matriculado
        const myEnrollments = enrollments.filter(e => e.userId === user.id);
        const myCourses = courses.filter(c => myEnrollments.some(e => e.courseId === c.id));
        if (myCourses.length === 0) {
            html = "<p>No estás matriculado en ningún curso.</p>";
        } else {
            html = "<h3>Mis cursos matriculados:</h3><ul>";
            myCourses.forEach(c => {
                html += `<li><strong>${c.title}</strong> - ${c.description}</li>`;
            });
            html += "</ul>";
        }
    } else if (user.role === "admin") {
        // Todos los cursos y usuarios matriculados
        html = "<h3>Todos los cursos y usuarios matriculados:</h3>";
        courses.forEach(c => {
            html += `<div style='margin-bottom:1em'><strong>${c.title}</strong> - ${c.description}<br><em>Usuarios matriculados:</em><ul>`;
            const enrolledUsers = enrollments.filter(e => e.courseId === c.id).map(e => users.find(u => u.id === e.userId));
            if (enrolledUsers.length === 0) {
                html += "<li>Nadie matriculado</li>";
            } else {
                enrolledUsers.forEach(u => {
                    html += `<li>${u ? u.name : 'Usuario desconocido'} (${u ? u.email : ''})</li>`;
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
                renderPublicCourses();
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
    // Protección de rutas
    if (pathname === "/dashboard" || pathname === "/courses" || pathname === "/index") {
        if (!user) {
            navigate("/");
            return;
        }
    }
}

window.addEventListener("popstate", () => {
    navigate(location.pathname);
});

// Cargar la ruta actual al iniciar la app
navigate(location.pathname);
