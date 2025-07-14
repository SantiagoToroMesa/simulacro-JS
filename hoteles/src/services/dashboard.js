import { get, post, update, deletes } from "./api";
import { getCurrentUser } from "./auth";

export async function getDashboardData() {
    try {
        const currentUser = getCurrentUser();
        // Hoteles
        const hotels = await get("http://localhost:3000/hotels");
        const hotelsTable = document.getElementById("hotels-table-body");
        if (hotelsTable) {
            hotelsTable.innerHTML = hotels.map(h => `
                <tr>
                    <td>${h.id}</td>
                    <td>${h.name}</td>
                    <td>${h.city}</td>
                    <td>${h.stars}</td>
                    <td>${h.services.join(", ")}</td>
                    <td>${h.roomsTotal}</td>
                    <td>${h.roomsAvailable}</td>
                    <td>$${h.pricePerNight}</td>
                    <td>
                        <button data-edit-id="${h.id}" class="edit-hotel-btn">✏️</button>
                        <button data-delete-id="${h.id}" class="delete-hotel-btn">🗑️</button>
                    </td>
                </tr>
            `).join("");
        }
        // Reservas
        const reservations = await get("http://localhost:3000/reservations");
        const users = await get("http://localhost:3000/users");
        const reservationsTable = document.getElementById("reservations-table-body");
        if (reservationsTable) {
            reservationsTable.innerHTML = reservations.map(r => {
                const user = users.find(u => u.id === r.userId);
                const hotel = hotels.find(h => h.id === r.hotelId);
                return `<tr>
                    <td>${r.id}</td>
                    <td>${user ? user.name : 'Desconocido'}</td>
                    <td>${hotel ? hotel.name : 'Desconocido'}</td>
                    <td>${r.checkIn}</td>
                    <td>${r.checkOut}</td>
                    <td>${r.rooms}</td>
                    <td>$${r.total}</td>
                    <td>${r.status}</td>
                    <td>${r.reservationDate}</td>
                    <td>
                        <button data-edit-id="${r.id}" class="edit-reservation-btn">✏️</button>
                        <button data-delete-id="${r.id}" class="delete-reservation-btn">🗑️</button>
                    </td>
                </tr>`;
            }).join("");
        }
        // Botón agregar hotel
        document.getElementById("add-hotel-btn")?.addEventListener("click", async () => {
            const { value: data, isConfirmed } = await Swal.fire({
                title: "Agregar Hotel",
                html: `
                    <input id="swal-hotel-name" class="swal2-input" placeholder="Nombre" required>
                    <input id="swal-hotel-city" class="swal2-input" placeholder="Ciudad" required>
                    <input id="swal-hotel-stars" class="swal2-input" placeholder="Estrellas" type="number" min="1" max="5" required>
                    <input id="swal-hotel-services" class="swal2-input" placeholder="Servicios (coma)" required>
                    <input id="swal-hotel-rooms" class="swal2-input" placeholder="Habitaciones Totales" type="number" required>
                    <input id="swal-hotel-price" class="swal2-input" placeholder="Precio por Noche" type="number" required>
                    <input id="swal-hotel-photos" class="swal2-input" placeholder="Fotos (urls, coma)" required>
                    <textarea id="swal-hotel-description" class="swal2-textarea" placeholder="Descripción" required></textarea>
                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: () => ({
                    name: document.getElementById("swal-hotel-name").value,
                    city: document.getElementById("swal-hotel-city").value,
                    stars: Number(document.getElementById("swal-hotel-stars").value),
                    services: document.getElementById("swal-hotel-services").value.split(",").map(s => s.trim()),
                    roomsTotal: Number(document.getElementById("swal-hotel-rooms").value),
                    roomsAvailable: Number(document.getElementById("swal-hotel-rooms").value),
                    pricePerNight: Number(document.getElementById("swal-hotel-price").value),
                    photos: document.getElementById("swal-hotel-photos").value.split(",").map(p => p.trim()),
                    description: document.getElementById("swal-hotel-description").value
                })
            });
            if (isConfirmed) {
                await post("http://localhost:3000/hotels", data);
                Swal.fire("Hotel agregado", "El hotel ha sido agregado correctamente", "success");
                getDashboardData();
            }
        });
        // Botón agregar reserva (por implementar)
        document.getElementById("add-reservation-btn")?.addEventListener("click", async () => {
            alert("Formulario para agregar reserva (por implementar)");
        });
        // Acciones editar/eliminar hotel y reserva (por implementar)
    } catch (e) {
        alert("Error al cargar el dashboard: " + e.message);
    }
}