import {get,update, patch, deletes} from "./api";
import {getCurrentUser} from "./auth";
import {addCourse} from "./courser";
import { enrollUser } from "./enrollment";

export async function getDashboardData() {
    try {
        const users = await get(`http://localhost:3000/users`);
        const userstable = document.getElementById("users-table-body");
        const currentUser = getCurrentUser();

        if (userstable) {
            userstable.innerHTML = "";
            let html = "";
            users.forEach((user) => {
                html += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>
                        ${
                            currentUser && currentUser.role === "admin"
                                ? `
                                    <button data-edit-id="${user.id}" data-type="user">✏️</button>
                                    <button data-delete-id="${user.id}" data-type="user">🗑️</button>
                                  `
                                : ""
                        }
                    </td>
                </tr>
                `;
            });
            userstable.innerHTML = html;
        }

        const courses = await get("http://localhost:3000/courses");
        const coursesTable = document.getElementById("courses-table-body");

        if (coursesTable) {
            coursesTable.innerHTML = "";
            let html = "";
            courses.forEach((c) => {
                html += `
        <tr>
           <td>${c.id}</td>
           <td>${c.title}</td>
           <td>${c.description}</td>
           <td>${c.startDate}</td>
           <td>${c.duration}</td>
           <td>
                      ${
                    currentUser && currentUser.role === "admin"
                        ? `
                                    <button data-edit-id="${c.id}" data-type="user">✏️</button>
                                    <button data-delete-id="${c.id}" data-type="user">🗑️</button>
                                  `
                        : `<button class="enroll-btn" data-enroll-id="${c.id}" data-type="enrollment">Enroll 📚</button>`
                }
           </td>
         </tr>
                `;
            });
            coursesTable.innerHTML = html;
            // Solo usuarios pueden ver el botón Enroll
            if(currentUser && currentUser.role === "user") {
                document.querySelectorAll('.enroll-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const courseId = btn.getAttribute('data-enroll-id'); // Usar como string
                        try {
                            await enrollUser(courseId); // No convertir a Number
                            Swal.fire({
                                title: 'Enrolled Successfully',
                                text: 'You have been enrolled in the course.',
                                icon: 'success'
                            });
                        } catch (err) {
                            Swal.fire({
                                title: 'Enrollment Failed',
                                text: err.message,
                                icon: 'error'
                            });
                        }
                    });
                });
            }
        }
        // Después de renderizar la tabla de cursos
        // Justo antes de crear el botón en getDashboardData
        if (coursesTable && currentUser && currentUser.role === "admin") {
            if (!document.getElementById("add-course-btn")) {
                const addBtn = document.createElement("button");
                addBtn.id = "add-course-btn";
                addBtn.textContent = "➕ Add a course";
                addBtn.className = "add-course-btn";
                coursesTable.parentElement.appendChild(addBtn);

                addBtn.addEventListener("click", addCourse);
            }
        }


        userstable?.addEventListener("click", async (e) => {
            const editBtn = e.target.closest("button[data-edit-id]");
            const deleteBtn = e.target.closest("button[data-delete-id]");

            if (editBtn) {
                const id = editBtn.dataset.editId;
                const user = users.find((u) => u.id == id);

                const { value: data, isConfirmed } = await Swal.fire({
                    title: "Editar Usuario",
                    html: `
                      <input id="swal-name" class="swal2-input" placeholder="Nombre" value="${user.name}">
                      <input id="swal-email" class="swal2-input" placeholder="Correo" value="${user.email}">
                      <select id="swal-role" class="swal2-input">
                        <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
                        <option value="user" ${user.role === "user" ? "selected" : ""}>user</option>
                      </select>
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    preConfirm: () => ({
                        name: document.getElementById("swal-name").value,
                        email: document.getElementById("swal-email").value,
                        role: document.getElementById("swal-role").value,
                    })
                });

                if (isConfirmed) {
                    await patch("http://localhost:3000/users", id, data);
                    Swal.fire("Actualizado", "Usuario modificado", "success");
                    getDashboardData();
                }
            }

            if (deleteBtn) {
                const id = deleteBtn.dataset.deleteId;
                const user = users.find((u) => u.id == id);

                Swal.fire({
                    title: "¿Estás seguro?",
                    text: `¿Quieres eliminar a ${user.name}?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await deletes(`http://localhost:3000/users/${id}`);
                        Swal.fire("Eliminado", "Usuario eliminado correctamente", "success");
                        getDashboardData();
                    }
                });
            }
        });
        coursesTable?.addEventListener("click", async (e) => {
            const editBtn = e.target.closest("button[data-edit-id]");
            const deleteBtn = e.target.closest("button[data-delete-id]");

            if (editBtn) {
                const id = editBtn.dataset.editId;
                const course = courses.find((c) => c.id == id);

                const { value: data, isConfirmed } = await Swal.fire({
                    title: "Editar Curso",
                    html: `
                      <input id="swal-title" class="swal2-input" placeholder="Título" value="${course.title}">
                      <input id="swal-description" class="swal2-input" placeholder="Descripción" value="${course.description}">
                      <input id="swal-startDate" class="swal2-input" placeholder="Inicio" value="${course.startDate}">
                      <input id="swal-duration" class="swal2-input" placeholder="Duración" value="${course.duration}">
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    preConfirm: () => ({
                        title: document.getElementById("swal-title").value,
                        description: document.getElementById("swal-description").value,
                        startDate: document.getElementById("swal-startDate").value,
                        duration: document.getElementById("swal-duration").value,
                    })
                });

                if (isConfirmed) {
                    await update("http://localhost:3000/courses", id, data);
                    Swal.fire("Actualizado", "Curso modificado", "success");
                    getDashboardData();
                }
            }

            // Dentro del listener de coursesTable
            if (deleteBtn) {
                const id = deleteBtn.dataset.deleteId;
                const course = courses.find((c) => c.id == id);
                Swal.fire({
                    title: "¿Estás seguro?",
                    text: `¿Quieres eliminar el curso?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await deletes(`http://localhost:3000/courses/${id}`);
                        Swal.fire("Eliminado", "Curso eliminado correctamente", "success");
                        getDashboardData();
                    }
                });
            }
        });

    }catch(e) {
        swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del dashboard.',
        });
        console.log(e);
    }
}