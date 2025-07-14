// importamos funciones de otro archivos js
import { get, post, update, deletes } from "./api";
import { getCurrentUser } from "./auth";

export async function getDashboardData() {
    try {
        // obtenemos los eventos de nuestro json y los imprimimimos en lista
        const events = await get("http://localhost:3000/events");
        const eventsTable = document.getElementById("events-table-body");
        if (eventsTable) {
            eventsTable.innerHTML = events.map(h => `
                <tr>
                    <td>${h.id}</td>
                    <td>${h.name}</td>
                    <td>${h.description}</td>
                    <td>${h.city}</td>
                    <td>${h.services.join(", ")}</td>
                    <td>${h.quotsTotal}</td>
                    <td>${h.quotsAvailable}</td>
                    <td>${h.date}</td>
                    <td>
                        <button data-edit-id="${h.id}" class="edit-event-btn">✏️</button>
                        <button data-delete-id="${h.id}" class="delete-event-btn">🗑️</button>
                    </td>
                </tr>
            `).join("");
        }

        // agregamos un addevent listener que escuche cuando le den click al boton addevent y agregue un nuevo evento
        document.getElementById("add-event-btn")?.addEventListener("click", async () => {
            const { value: data, isConfirmed } = await Swal.fire({
                title: "Add event",
                html: `
                    <input id="swal-event-name" class="swal2-input" placeholder="Event name" required>
                    <input id="swal-event-city" class="swal2-input" placeholder="City" required>
                    <input id="swal-event-services" class="swal2-input" placeholder="Activities (coma)" required>
                    <input id="swal-event-quots" class="swal2-input" placeholder="Capacity" type="number" required>
                    <input id="swal-event-photos" class="swal2-input" placeholder="Fotos (urls, coma)" required>
                    <textarea id="swal-event-description" class="swal2-textarea" placeholder="Description" required></textarea>
                    <input id="swal-event-date"class="swal2-input" placeholder="Date" type="date"required></textarea>
                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: () => ({
                    name: document.getElementById("swal-event-name").value,
                    city: document.getElementById("swal-event-city").value,
                    services: document.getElementById("swal-event-services").value.split(",").map(s => s.trim()),
                    quotsTotal: Number(document.getElementById("swal-event-quots").value),
                    quotsAvailable: Number(document.getElementById("swal-event-quots").value),
                    photos: document.getElementById("swal-event-photos").value.split(",").map(p => p.trim()),
                    description: document.getElementById("swal-event-description").value,
                    date: document.getElementById("swal-event-date").value
                })
            });
            if (isConfirmed) {
                // si el swal.fire es confirmado se envia el nuevo evento con un post
                await post("http://localhost:3000/events", data);
                Swal.fire("event agregado", "El event ha sido agregado correctamente", "success");
                getDashboardData();
            }
        });
      
        // Acciones editar/eliminar event
        eventsTable?.addEventListener("click", async (e) => {
            const editBtn = e.target.closest(".edit-event-btn");
            const deleteBtn = e.target.closest(".delete-event-btn");
            if (editBtn) {
                const id = editBtn.dataset.editId;
                const event = events.find(h => h.id == id);
                // obtenemos los valos de los eventos y los ponemos en un input para luego editarlos
                const { value: data, isConfirmed } = await Swal.fire({
                    title: "Editar event",
                    html: `
                        <input id="swal-event-name" class="swal2-input" placeholder="Nombre" value="${event.name}" required>
                        <input id="swal-event-city" class="swal2-input" placeholder="Ciudad" value="${event.city}" required>
                        <input id="swal-event-services" class="swal2-input" placeholder="Servicios (coma)" value="${event.services.join(', ')}" required>
                        <input id="swal-event-quots" class="swal2-input" placeholder="total attendees" type="number" value="${event.quotsTotal}" required>
                        <input id="swal-event-photos" class="swal2-input" placeholder="photos (urls, coma)" value="${event.photos.join(', ')}" required>
                        <textarea id="swal-event-description" class="swal2-textarea" placeholder="Description" required>${event.description}</textarea>
                        <input id="swal-event-date" class="swal2-input" placeholder="Date" type="date"required></textarea>
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    // si confirma se envia los cambios al db.json
                    preConfirm: () => (
                        {
                        name: document.getElementById("swal-event-name").value,
                        city: document.getElementById("swal-event-city").value,
                        services: document.getElementById("swal-event-services").value.split(",").map(s => s.trim()),
                        quotsTotal: Number(document.getElementById("swal-event-quots").value),
                        quotsAvailable: Number(document.getElementById("swal-event-quots").value),
                        photos: document.getElementById("swal-event-photos").value.split(",").map(p => p.trim()),
                        description: document.getElementById("swal-event-description").value,
                        date: document.getElementById("swal-event-date").value
                    })
                });
                if (isConfirmed) {
                    // aviso de exito para mostrarle al admin
                    await update("http://localhost:3000/events", id, data);
                    Swal.fire("event actualizado", "El event ha sido actualizado", "success");
                    getDashboardData();
                }
            }
            if (deleteBtn) {
                const id = deleteBtn.dataset.deleteId;
                const event = events.find(h => h.id == id);
                // aviso de confirmacion para eliminar un elemento
                Swal.fire({
                    title: `¿Eliminar event '${event.name}'?`,
                    text: "Esta acción no se puede deshacer.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await deletes(`http://localhost:3000/events/${id}`);
                        Swal.fire("Eliminado", "El event ha sido eliminado", "success");
                        getDashboardData();
                    }
                });
            }
        });
    // en caso de un error al obtener el dashboard mostrar error
    } catch (e) {
        alert("Error al cargar el dashboard: " + e.message);
        console.log(e)
    }
}