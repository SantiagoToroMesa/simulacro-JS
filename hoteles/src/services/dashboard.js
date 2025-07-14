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
        // Botón agregar reserva
        document.getElementById("add-reservation-btn")?.addEventListener("click", async () => {
            const users = await get("http://localhost:3000/users");
            const hotels = await get("http://localhost:3000/hotels");
            const userOptions = users.map(u => `<option value='${u.id}'>${u.name}</option>`).join("");
            const hotelOptions = hotels.map(h => `<option value='${h.id}'>${h.name} (${h.city})</option>`).join("");
            const { value: data, isConfirmed } = await Swal.fire({
                title: "Agregar Reserva",
                html: `
                    <label>Usuario:</label><select id='swal-res-user'>${userOptions}</select><br>
                    <label>Hotel:</label><select id='swal-res-hotel'>${hotelOptions}</select><br>
                    <input id='swal-res-checkin' class='swal2-input' type='date' placeholder='Check-in' required>
                    <input id='swal-res-checkout' class='swal2-input' type='date' placeholder='Check-out' required>
                    <input id='swal-res-rooms' class='swal2-input' type='number' placeholder='Habitaciones' min='1' required>
                    <select id='swal-res-status' class='swal2-input'>
                        <option value='confirmada'>Confirmada</option>
                        <option value='cancelada'>Cancelada</option>
                        <option value='finalizada'>Finalizada</option>
                    </select>
                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: () => {
                    const hotel = hotels.find(h => h.id === document.getElementById('swal-res-hotel').value);
                    const rooms = Number(document.getElementById('swal-res-rooms').value);
                    if (!hotel || rooms > hotel.roomsAvailable) {
                        Swal.showValidationMessage('No hay suficientes habitaciones disponibles');
                        return false;
                    }
                    const checkIn = document.getElementById('swal-res-checkin').value;
                    const checkOut = document.getElementById('swal-res-checkout').value;
                    if (!checkIn || !checkOut || checkIn >= checkOut) {
                        Swal.showValidationMessage('Fechas inválidas');
                        return false;
                    }
                    return {
                        userId: document.getElementById('swal-res-user').value,
                        hotelId: document.getElementById('swal-res-hotel').value,
                        checkIn,
                        checkOut,
                        rooms,
                        total: rooms * hotel.pricePerNight * (new Date(checkOut) - new Date(checkIn)) / (1000*60*60*24),
                        status: document.getElementById('swal-res-status').value,
                        reservationDate: new Date().toLocaleString()
                    };
                }
            });
            if (isConfirmed) {
                await post("http://localhost:3000/reservations", data);
                // Actualizar habitaciones disponibles
                const hotel = hotels.find(h => h.id === data.hotelId);
                await update("http://localhost:3000/hotels", data.hotelId, { roomsAvailable: hotel.roomsAvailable - data.rooms });
                Swal.fire("Reserva agregada", "La reserva ha sido registrada", "success");
                getDashboardData();
            }
        });
        // Acciones editar/eliminar hotel
        hotelsTable?.addEventListener("click", async (e) => {
            const editBtn = e.target.closest(".edit-hotel-btn");
            const deleteBtn = e.target.closest(".delete-hotel-btn");
            if (editBtn) {
                const id = editBtn.dataset.editId;
                const hotel = hotels.find(h => h.id == id);
                const { value: data, isConfirmed } = await Swal.fire({
                    title: "Editar Hotel",
                    html: `
                        <input id="swal-hotel-name" class="swal2-input" placeholder="Nombre" value="${hotel.name}" required>
                        <input id="swal-hotel-city" class="swal2-input" placeholder="Ciudad" value="${hotel.city}" required>
                        <input id="swal-hotel-stars" class="swal2-input" placeholder="Estrellas" type="number" min="1" max="5" value="${hotel.stars}" required>
                        <input id="swal-hotel-services" class="swal2-input" placeholder="Servicios (coma)" value="${hotel.services.join(', ')}" required>
                        <input id="swal-hotel-rooms" class="swal2-input" placeholder="Habitaciones Totales" type="number" value="${hotel.roomsTotal}" required>
                        <input id="swal-hotel-available" class="swal2-input" placeholder="Habitaciones Disponibles" type="number" value="${hotel.roomsAvailable}" required>
                        <input id="swal-hotel-price" class="swal2-input" placeholder="Precio por Noche" type="number" value="${hotel.pricePerNight}" required>
                        <input id="swal-hotel-photos" class="swal2-input" placeholder="Fotos (urls, coma)" value="${hotel.photos.join(', ')}" required>
                        <textarea id="swal-hotel-description" class="swal2-textarea" placeholder="Descripción" required>${hotel.description}</textarea>
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    preConfirm: () => ({
                        name: document.getElementById("swal-hotel-name").value,
                        city: document.getElementById("swal-hotel-city").value,
                        stars: Number(document.getElementById("swal-hotel-stars").value),
                        services: document.getElementById("swal-hotel-services").value.split(",").map(s => s.trim()),
                        roomsTotal: Number(document.getElementById("swal-hotel-rooms").value),
                        roomsAvailable: Number(document.getElementById("swal-hotel-available").value),
                        pricePerNight: Number(document.getElementById("swal-hotel-price").value),
                        photos: document.getElementById("swal-hotel-photos").value.split(",").map(p => p.trim()),
                        description: document.getElementById("swal-hotel-description").value
                    })
                });
                if (isConfirmed) {
                    await update("http://localhost:3000/hotels", id, data);
                    Swal.fire("Hotel actualizado", "El hotel ha sido actualizado", "success");
                    getDashboardData();
                }
            }
            if (deleteBtn) {
                const id = deleteBtn.dataset.deleteId;
                const hotel = hotels.find(h => h.id == id);
                Swal.fire({
                    title: `¿Eliminar hotel '${hotel.name}'?`,
                    text: "Esta acción no se puede deshacer.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await deletes(`http://localhost:3000/hotels/${id}`);
                        Swal.fire("Eliminado", "El hotel ha sido eliminado", "success");
                        getDashboardData();
                    }
                });
            }
        });
        // Acciones editar/eliminar reserva
        reservationsTable?.addEventListener("click", async (e) => {
            const editBtn = e.target.closest(".edit-reservation-btn");
            const deleteBtn = e.target.closest(".delete-reservation-btn");
            if (editBtn) {
                const id = editBtn.dataset.editId;
                const reservation = reservations.find(r => r.id == id);
                const users = await get("http://localhost:3000/users");
                const hotels = await get("http://localhost:3000/hotels");
                const userOptions = users.map(u => `<option value='${u.id}' ${reservation.userId === u.id ? 'selected' : ''}>${u.name}</option>`).join("");
                const hotelOptions = hotels.map(h => `<option value='${h.id}' ${reservation.hotelId === h.id ? 'selected' : ''}>${h.name} (${h.city})</option>`).join("");
                const { value: data, isConfirmed } = await Swal.fire({
                    title: "Editar Reserva",
                    html: `
                        <label>Usuario:</label><select id='swal-res-user'>${userOptions}</select><br>
                        <label>Hotel:</label><select id='swal-res-hotel'>${hotelOptions}</select><br>
                        <input id='swal-res-checkin' class='swal2-input' type='date' value='${reservation.checkIn}' required>
                        <input id='swal-res-checkout' class='swal2-input' type='date' value='${reservation.checkOut}' required>
                        <input id='swal-res-rooms' class='swal2-input' type='number' value='${reservation.rooms}' min='1' required>
                        <select id='swal-res-status' class='swal2-input'>
                            <option value='confirmada' ${reservation.status === 'confirmada' ? 'selected' : ''}>Confirmada</option>
                            <option value='cancelada' ${reservation.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                            <option value='finalizada' ${reservation.status === 'finalizada' ? 'selected' : ''}>Finalizada</option>
                        </select>
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    preConfirm: () => {
                        const hotel = hotels.find(h => h.id === document.getElementById('swal-res-hotel').value);
                        const rooms = Number(document.getElementById('swal-res-rooms').value);
                        if (!hotel || rooms > hotel.roomsAvailable + reservation.rooms) {
                            Swal.showValidationMessage('No hay suficientes habitaciones disponibles');
                            return false;
                        }
                        const checkIn = document.getElementById('swal-res-checkin').value;
                        const checkOut = document.getElementById('swal-res-checkout').value;
                        if (!checkIn || !checkOut || checkIn >= checkOut) {
                            Swal.showValidationMessage('Fechas inválidas');
                            return false;
                        }
                        return {
                            userId: document.getElementById('swal-res-user').value,
                            hotelId: document.getElementById('swal-res-hotel').value,
                            checkIn,
                            checkOut,
                            rooms,
                            total: rooms * hotel.pricePerNight * (new Date(checkOut) - new Date(checkIn)) / (1000*60*60*24),
                            status: document.getElementById('swal-res-status').value,
                            reservationDate: reservation.reservationDate
                        };
                    }
                });
                if (isConfirmed) {
                    // Actualizar habitaciones disponibles si cambió la cantidad
                    const hotel = hotels.find(h => h.id === data.hotelId);
                    const diff = data.rooms - reservation.rooms;
                    await update("http://localhost:3000/hotels", data.hotelId, { roomsAvailable: hotel.roomsAvailable - diff });
                    await update("http://localhost:3000/reservations", id, data);
                    Swal.fire("Reserva actualizada", "La reserva ha sido actualizada", "success");
                    getDashboardData();
                }
            }
            if (deleteBtn) {
                const id = deleteBtn.dataset.deleteId;
                const reservation = reservations.find(r => r.id == id);
                Swal.fire({
                    title: `¿Eliminar reserva de ${reservation.checkIn} a ${reservation.checkOut}?`,
                    text: "Esta acción no se puede deshacer.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        // Devolver habitaciones al hotel
                        const hotel = hotels.find(h => h.id === reservation.hotelId);
                        await update("http://localhost:3000/hotels", reservation.hotelId, { roomsAvailable: hotel.roomsAvailable + reservation.rooms });
                        await deletes(`http://localhost:3000/reservations/${id}`);
                        Swal.fire("Eliminada", "La reserva ha sido eliminada", "success");
                        getDashboardData();
                    }
                });
            }
        });
    } catch (e) {
        alert("Error al cargar el dashboard: " + e.message);
    }
}