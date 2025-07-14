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
    "/events": "src/pages/events.html",
    "/admin-reservas": "src/pages/admin-reservas.html",
    // rutas para el navigate
};

document.body.addEventListener("click", (e) => {
    // obtenemos el datalink al dar click en un a (obtendremos su href)
    if (e.target.matches("[data-link]")) {
        e.preventDefault();
        navigate(e.target.getAttribute("href"));
    }
});

async function rendereventsList() {
    // renderizamos las lista de eventos con su informacion su imagen y un boton de mas detalles
    const container = document.getElementById("events-list");
    if (!container) return;
    container.innerHTML = "Cargando eventes...";
    const events = await get("http://localhost:3000/events");
    let html = '<div class="events-cards">';
    events.forEach(event => {
        html += `
        <div class='event-card'>
            <img src='${event.photos[0] || "https://via.placeholder.com/200x120?text=event"}' alt='${event.name}' class='event-img'/>
            <h3>${event.name}</h3>
            <p>${event.city}</p>
            <button onclick="verDetalleevent('${event.id}')">Ver detalles</button>
        </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}
window.verDetalleevent = async function(eventId) {
    // funcion para el boton de detalles para asi darle click se ejecute
    const events = await get("http://localhost:3000/events");
    const event = events.find(h => h.id === eventId);
    if (!event) return;
    const user = JSON.parse(localStorage.getItem("user"));
    let html = `<img src='${event.photos[0] || "https://via.placeholder.com/300x180?text=event"}' style='width:100%;max-width:300px;border-radius:8px;margin-bottom:1em;'/>
               <p><strong>City:</strong> ${event.city}</p>
               <p><strong>Activities:</strong> ${event.services.join(', ')}</p>
               <p><strong>Description:</strong> ${event.description}</p>
               <p><strong>available places:</strong> ${event.quotsAvailable}</p>`;
    if (user && user.role === "user") {
        // Mostrar formulario de reserva directamente en el modal
        html += `<hr><h4>Reservar</h4>
            <input id='swal-res-quots' class='swal2-input' type='number' placeholder='capacity' min='1' max='${event.quotsAvailable}' required>
        `;
    }
    const result = await Swal.fire({
        title: event.name,
        html,
        showCancelButton: true,
        confirmButtonText: user && user.role === "user" ? 'Reservar' : 'Cerrar',
        focusConfirm: false,
        preConfirm: () => {
            if (!(user && user.role === "user")) return true;
            const quots = Number(document.getElementById('swal-res-quots').value);
            // si no hay quots (cupos) disponibles no lo dejara reservar el evento
            if (quots < 1 || quots > event.quotsAvailable) {
                Swal.showValidationMessage('There are no places available for this event');
                return false;
            }
            return {quots};
        }
    });
    if (result.isConfirmed && user && user.role === "user" && result.value) {
        const data = result.value;
        await fetch('http://localhost:3000/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                eventId: event.id,
                quots: data.quots,
                reservationDate: new Date().toLocaleString()
            })
        });
        await fetch(`http://localhost:3000/events/${event.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quotsAvailable: event.quotsAvailable - data.quots })
        });
        Swal.fire('Reserva realizada', 'Tu reserva ha sido registrada', 'success').then(() => {
            navigate('/public');
        });
    }
}

async function renderUserReservations() {
    // renderizamos las reservaciones para los usuarios
    const container = document.getElementById("user-reservations-list");
    if (!container) return;
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        container.innerHTML = "Debes iniciar sesión para ver tus reservas.";
        return;
    }
    const [reservations, events] = await Promise.all([
        get("http://localhost:3000/reservations"),
        get("http://localhost:3000/events")
    ]);
    const myReservations = reservations.filter(r => r.userId === user.id);
    if (myReservations.length === 0) {
        container.innerHTML = "<p>No tienes reservas registradas.</p>";
        return;
    }
    let html = `<table class='user-res-table'><thead><tr><th>event</th><th>Description</th><th>City</th><th>People attend</th><th>Event date</th></tr></thead><tbody>`;
    myReservations.forEach(r => {
        const event = events.find(h => h.id === r.eventId);
        html += `<tr>
            <td>${event ? event.name : 'event eliminado'}</td>
            <td>${event ? event.description : 'No hay descripción'}</td>
            <td>${event ? event.city : 'No hay ciudad'}</td>
            <td>${r.quots}</td>
            <td>${event ? event.date : 'No hay fecha'  }</td>
</td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}
async function renderAdminReservations() {
    // renderizamos las reservaciones para los admins
    const container = document.getElementById("admin-reservations-list");
    if (!container) return;
    const [reservations, events, users] = await Promise.all([
        get("http://localhost:3000/reservations"),
        get("http://localhost:3000/events"),
        get("http://localhost:3000/users")
    ]);
    if (reservations.length === 0) {
        // en caso de que no halla reservas se mostrara este mensaje
        container.innerHTML = "<p>No hay reservas en el sistema.</p>";
        return;
    }
    let html = `<table class='user-res-table'><thead><tr><th>ID</th><th>User</th><th>Event</th><th>quotas</th><th>reserve date</th><th>event date</th></tr></thead><tbody>`;
    reservations.forEach(r => {
        const event = events.find(h => h.id === r.eventId);
        const user = users.find(u => u.id === r.userId);
        html += `<tr>
            <td>${r ? r.id : ""}</td>
            <td>${user ? user.name : ""}</td>
            <td>${event ? event.name : ""}</td>
            <td>${r ? r.quots: ""}</td>
            <td>${r ? r.reservationDate: "" }</td>
            <td>${event ? event.date: ""}</td>
        </tr>`;
    });
    html += '</tbody></table>';
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
    const privateRoutes = ["/dashboard", "/events", "/index"];
    if (privateRoutes.includes(pathname)) {
        if (!user) {
            // Si no hay usuario logueado, redirige al login
            navigate("/");
            return;
        }
    }
    // Protección de rutas: Solo admin puede acceder a dashboard
    if (pathname === "/dashboard" && user && user.role !== "admin") {
        // Si el usuario no es admin, redirige a la vista pública de eventes
        navigate("/events");
        return;
    }
    // Redirección automática después de login
    if (pathname === "/" && user) {
        if (user.role === "admin") {
            navigate("/dashboard");
            return;
        } else {
            navigate("/events");
            return;
        }
    }

    if (pathname === "/" || pathname === "/register") {
        // ocultar el app y el header si aun no ha hecho un login
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
                // ejecuta la funcion correspondiente a su pagina
                renderUserReservations();
            }
            if (pathname === "/dashboard") {
                // ejecuta la funcion correspondiente a su pagina
                getDashboardData();
            }
            if (pathname === "/events") {
                // ejecuta la funcion correspondiente a su pagina
                rendereventsList();
            }
            if (pathname === "/register") {
                // ejecuta la funcion correspondiente a su pagina
                setupRegister();
            }
            if (pathname === "/admin-reservas" && user && user.role === "admin") {
                // ejecuta la funcion correspondiente a su pagina
                renderAdminReservations();
            }
            if (pathname === "/admin-reservas" && user && user.role === "user") {
                // en caso de ser usuario y querer entrar a la pagina de admin se le redirige a events
                navigate("/events");
                rendereventsList()
            }
        }
    }
}

window.addEventListener("popstate", () => {
    navigate(location.pathname);
});

// Cargar la ruta actual al iniciar la app
navigate(location.pathname);

