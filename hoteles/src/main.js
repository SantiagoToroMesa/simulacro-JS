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
    "/admin-reservas": "src/pages/admin-reservas.html",
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
    // 1. Selecciona el contenedor donde se mostrarán los cursos.
    const container = document.getElementById("public-courses-container");
    if (!container) return; // Si no existe, termina.
    container.innerHTML = "Cargando cursos..."; // Muestra mensaje de carga.
    // 2. Obtiene el usuario actual desde localStorage.
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        container.innerHTML = "Debes iniciar sesión para ver los cursos."; // Si no hay usuario, pide login.
        return;
    }
    // 3. Obtiene todos los cursos, inscripciones y usuarios en paralelo.
    const [courses, enrollments, users] = await Promise.all([
        get("http://localhost:3000/courses"),
        get("http://localhost:3000/enrollments"),
        get("http://localhost:3000/users")
    ]);
    let html = "";
    if (user.role === "user") { // 4. Si es usuario normal...
        // Filtra las inscripciones del usuario actual.
        const myEnrollments = enrollments.filter(e => e.userId === user.id);
        // Filtra los cursos en los que está inscrito el usuario.
        const myCourses = courses.filter(c => myEnrollments.some(e => e.courseId === c.id));
        if (myCourses.length === 0) {
            html = "<p>No estás matriculado en ningún curso.</p>"; // Si no hay cursos, mensaje.
        } else {
            html = "<h3>Mis cursos matriculados:</h3><ul>";
            myCourses.forEach(c => {
                html += `<li><strong>${c.title}</strong> - ${c.description}</li>`; // Imprime cada curso.
            });
            html += "</ul>";
        }
    } else if (user.role === "admin") { // 5. Si es admin...
        html = "<h3>Todos los cursos y usuarios matriculados:</h3>";
        courses.forEach(c => {
            html += `<div style='margin-bottom:1em'><strong>${c.title}</strong> - ${c.description}<br><em>Usuarios matriculados:</em><ul>`;
            // Filtra inscripciones de ese curso y busca los usuarios inscritos.
            const enrolledUsers = enrollments.filter(e => e.courseId === c.id).map(e => users.find(u => u.id === e.userId));
            if (enrolledUsers.length === 0) {
                html += "<li>Nadie matriculado</li>"; // Si no hay inscritos, mensaje.
            } else {
                enrolledUsers.forEach(u => {
                    html += `<li>${u ? u.name : 'Usuario desconocido'} (${u ? u.email : ''})</li>`; // Imprime nombre y correo de cada inscrito.
                });
            }
            html += "</ul></div>";
        });
    }
    container.innerHTML = html; // 6. Inserta el HTML generado en el contenedor.
}

async function renderHotelsList() {
    const container = document.getElementById("hotels-list");
    if (!container) return;
    container.innerHTML = "Cargando hoteles...";
    const hotels = await get("http://localhost:3000/hotels");
    let html = '<div class="hotels-cards">';
    hotels.forEach(hotel => {
        html += `
        <div class='hotel-card'>
            <img src='${hotel.photos[0] || "https://via.placeholder.com/200x120?text=Hotel"}' alt='${hotel.name}' class='hotel-img'/>
            <h3>${hotel.name}</h3>
            <p>${hotel.city}</p>
            <p>${'★'.repeat(hotel.stars)}${'☆'.repeat(5-hotel.stars)}</p>
            <button onclick="verDetalleHotel('${hotel.id}')">Ver detalles</button>
        </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}
window.verDetalleHotel = async function(hotelId) {
    const hotels = await get("http://localhost:3000/hotels");
    const hotel = hotels.find(h => h.id === hotelId);
    if (!hotel) return;
    const user = JSON.parse(localStorage.getItem("user"));
    let html = `<img src='${hotel.photos[0] || "https://via.placeholder.com/300x180?text=Hotel"}' style='width:100%;max-width:300px;border-radius:8px;margin-bottom:1em;'/>
               <p><strong>Ciudad:</strong> ${hotel.city}</p>
               <p><strong>Estrellas:</strong> ${'★'.repeat(hotel.stars)}${'☆'.repeat(5-hotel.stars)}</p>
               <p><strong>Servicios:</strong> ${hotel.services.join(', ')}</p>
               <p><strong>Descripción:</strong> ${hotel.description}</p>
               <p><strong>Precio por noche:</strong> $${hotel.pricePerNight}</p>
               <p><strong>Habitaciones disponibles:</strong> ${hotel.roomsAvailable}</p>`;
    if (user && user.role === "user") {
        // Mostrar formulario de reserva directamente en el modal
        html += `<hr><h4>Reservar</h4>
            <input id='swal-res-checkin' class='swal2-input' type='date' placeholder='Check-in' required>
            <input id='swal-res-checkout' class='swal2-input' type='date' placeholder='Check-out' required>
            <input id='swal-res-rooms' class='swal2-input' type='number' placeholder='Habitaciones' min='1' max='${hotel.roomsAvailable}' required>
        `;
    }
    const result = await Swal.fire({
        title: hotel.name,
        html,
        showCancelButton: true,
        confirmButtonText: user && user.role === "user" ? 'Reservar' : 'Cerrar',
        focusConfirm: false,
        preConfirm: () => {
            if (!(user && user.role === "user")) return true;
            const checkIn = document.getElementById('swal-res-checkin').value;
            const checkOut = document.getElementById('swal-res-checkout').value;
            const rooms = Number(document.getElementById('swal-res-rooms').value);
            if (!checkIn || !checkOut || checkIn >= checkOut) {
                Swal.showValidationMessage('Fechas inválidas');
                return false;
            }
            if (rooms < 1 || rooms > hotel.roomsAvailable) {
                Swal.showValidationMessage('Cantidad de habitaciones inválida');
                return false;
            }
            return { checkIn, checkOut, rooms };
        }
    });
    if (result.isConfirmed && user && user.role === "user" && result.value) {
        const data = result.value;
        const total = data.rooms * hotel.pricePerNight * (new Date(data.checkOut) - new Date(data.checkIn)) / (1000*60*60*24);
        await fetch('http://localhost:3000/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                hotelId: hotel.id,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                rooms: data.rooms,
                total,
                status: 'confirmada',
                reservationDate: new Date().toLocaleString()
            })
        });
        await fetch(`http://localhost:3000/hotels/${hotel.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomsAvailable: hotel.roomsAvailable - data.rooms })
        });
        Swal.fire('Reserva realizada', 'Tu reserva ha sido registrada', 'success').then(() => {
            navigate('/public');
        });
    }
}

async function renderUserReservations() {
    const container = document.getElementById("user-reservations-list");
    if (!container) return;
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        container.innerHTML = "Debes iniciar sesión para ver tus reservas.";
        return;
    }
    const [reservations, hotels] = await Promise.all([
        get("http://localhost:3000/reservations"),
        get("http://localhost:3000/hotels")
    ]);
    const myReservations = reservations.filter(r => r.userId === user.id);
    if (myReservations.length === 0) {
        container.innerHTML = "<p>No tienes reservas registradas.</p>";
        return;
    }
    let html = `<table class='user-res-table'><thead><tr><th>Hotel</th><th>Check-in</th><th>Check-out</th><th>Habitaciones</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>`;
    myReservations.forEach(r => {
        const hotel = hotels.find(h => h.id === r.hotelId);
        const isFuture = new Date(r.checkIn) > new Date() && r.status === 'confirmada';
        html += `<tr>
            <td>${hotel ? hotel.name : 'Hotel eliminado'}</td>
            <td>${r.checkIn}</td>
            <td>${r.checkOut}</td>
            <td>${r.rooms}</td>
            <td>$${r.total}</td>
            <td>${r.status}</td>
            <td>${isFuture ? `<button onclick="cancelarReserva('${r.id}')">Cancelar</button>` : ''}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}
window.cancelarReserva = async function(resId) {
    const reservations = await get("http://localhost:3000/reservations");
    const hotels = await get("http://localhost:3000/hotels");
    const r = reservations.find(r => r.id === resId);
    if (!r) return;
    const hotel = hotels.find(h => h.id === r.hotelId);
    const confirm = await Swal.fire({
        title: '¿Cancelar reserva?',
        text: `¿Seguro que deseas cancelar tu reserva en ${hotel ? hotel.name : 'hotel'} del ${r.checkIn} al ${r.checkOut}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No'
    });
    if (confirm.isConfirmed) {
        // Cambiar estado a cancelada y devolver habitaciones
        await fetch(`http://localhost:3000/reservations/${resId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelada' })
        });
        if (hotel) {
            await fetch(`http://localhost:3000/hotels/${hotel.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomsAvailable: hotel.roomsAvailable + r.rooms })
            });
        }
        Swal.fire('Cancelada', 'Tu reserva ha sido cancelada', 'success');
        renderUserReservations();
    }
}

async function renderAdminReservations() {
    const container = document.getElementById("admin-reservations-list");
    if (!container) return;
    const [reservations, hotels, users] = await Promise.all([
        get("http://localhost:3000/reservations"),
        get("http://localhost:3000/hotels"),
        get("http://localhost:3000/users")
    ]);
    if (reservations.length === 0) {
        container.innerHTML = "<p>No hay reservas en el sistema.</p>";
        return;
    }
    let html = `<table class='user-res-table'><thead><tr><th>ID</th><th>Usuario</th><th>Hotel</th><th>Check-in</th><th>Check-out</th><th>Habitaciones</th><th>Total</th><th>Estado</th><th>Fecha Reserva</th></tr></thead><tbody>`;
    reservations.forEach(r => {
        const hotel = hotels.find(h => h.id === r.hotelId);
        const user = users.find(u => u.id === r.userId);
        html += `<tr>
            <td>${r.id}</td>
            <td>${user ? user.name : 'Desconocido'}</td>
            <td>${hotel ? hotel.name : 'Hotel eliminado'}</td>
            <td>${r.checkIn}</td>
            <td>${r.checkOut}</td>
            <td>${r.rooms}</td>
            <td>$${r.total}</td>
            <td>${r.status}</td>
            <td>${r.reservationDate}</td>
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
        // Si el usuario no es admin, redirige a la vista pública de hoteles
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
                renderUserReservations();
            }
            if (pathname === "/dashboard") {
                getDashboardData();
            }
            if (pathname === "/courses") {
                renderHotelsList();
            }
            if (pathname === "/register") {
                setupRegister();
            }
            if (pathname === "/admin-reservas" && user && user.role === "admin") {
                renderAdminReservations();
            }
        }
    }
}

window.addEventListener("popstate", () => {
    navigate(location.pathname);
});

// Cargar la ruta actual al iniciar la app
navigate(location.pathname);

if (document.getElementById('print-reservations-btn')) {
    document.getElementById('print-reservations-btn').onclick = function() {
        const table = document.querySelector('.user-res-table');
        if (!table) return;
        const printWindow = window.open('', '', 'width=900,height=700');
        printWindow.document.write('<html><head><title>Mis Reservas</title>');
        printWindow.document.write('<style>body{font-family:sans-serif;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:0.6em 1em;text-align:center;}th{background:#f0f0f0;}tr:nth-child(even){background:#f9f9f9;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h2>Mis Reservas</h2>');
        printWindow.document.write(table.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }
}
