import {get, update, patch, deletes, post} from "./api";
import {getCurrentUser} from "./auth";

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

        const products = await get("http://localhost:3000/products");
        const productsTable = document.getElementById("products-table-body");

        if (productsTable) {
            productsTable.innerHTML = "";
            let html = "";
            products.forEach((p) => {
                html += `
        <tr>
           <td>${p.id}</td>
           <td>${p.name}</td>
           <td>${p.description}</td>
           <td>${p.price}</td>
           <td>${p.stock}</td>
           <td>
                      ${
                    currentUser && currentUser.role === "admin"
                        ? `
                                    <button data-edit-id="${p.id}" data-type="product">✏️</button>
                                    <button data-delete-id="${p.id}" data-type="product">🗑️</button>
                                  `
                        : ""
                }
           </td>
         </tr>
                `;
            });
            productsTable.innerHTML = html;
        }

        const purchases = await get("http://localhost:3000/purchases");
        const purchasesTable = document.getElementById("purchases-table-body");

        if (purchasesTable) {
            purchasesTable.innerHTML = "";
            let html = "";
            purchases.forEach((p) => {
                html += `
        <tr>
           <td>${p.id}</td>
           <td>${p.productName}</td>
           <td>${p.quantity}</td>
           <td>${p.totalPrice}</td>
           <td>${p.purchaseDate}</td>
           <td>${p.userId}</td>
           <td>
                      ${
                    currentUser && currentUser.role === "admin"
                        ? `
                                    <button data-edit-id="${p.id}" data-type="purchase">✏️</button>
                                    <button data-delete-id="${p.id}" data-type="purchase">🗑️</button>
                                  `
                        : ""
                }
           </td>
         </tr>
                `;
            });
            purchasesTable.innerHTML = html;
        }

        // Después de renderizar la tabla de productos
        // Justo antes de crear el botón en getDashboardData
        if (productsTable && currentUser && currentUser.role === "admin") {
            if (!document.getElementById("add-product-btn")) {
                const addBtn = document.createElement("button");
                addBtn.id = "add-product-btn";
                addBtn.textContent = "➕ Add a product";
                addBtn.className = "add-product-btn";
                productsTable.parentElement.appendChild(addBtn);

                addBtn.addEventListener("click", async () => {
                    const { value: data, isConfirmed } = await Swal.fire({
                        title: "Nuevo Producto",
                        html: `
                          <input id="swal-product-name" class="swal2-input" placeholder="Nombre del Producto" required>
                          <input id="swal-product-description" class="swal2-input" placeholder="Descripción" required>
                          <input id="swal-product-price" class="swal2-input" placeholder="Precio" type="number" required>
                          <input id="swal-product-stock" class="swal2-input" placeholder="Stock" type="number" required>
                        `,
                        focusConfirm: false,
                        showCancelButton: true,
                        preConfirm: () => ({
                            name: document.getElementById("swal-product-name").value,
                            description: document.getElementById("swal-product-description").value,
                            price: document.getElementById("swal-product-price").value,
                            stock: document.getElementById("swal-product-stock").value,
                        })
                    });

                    if (isConfirmed) {
                        await post("http://localhost:3000/products", data);
                        Swal.fire("Producto Agregado", "Producto agregado correctamente", "success");
                        getDashboardData();
                    }
                });
            }
        }

        // Después de renderizar la tabla de compras
        // Justo antes de crear el botón en getDashboardData
        if (purchasesTable && currentUser && currentUser.role === "admin") {
            if (!document.getElementById("add-purchase-btn")) {
                const addBtn = document.createElement("button");
                addBtn.id = "add-purchase-btn";
                addBtn.textContent = "➕ Add a purchase";
                addBtn.className = "add-purchase-btn";
                purchasesTable.parentElement.appendChild(addBtn);

                addBtn.addEventListener("click", async () => {
                    const products = await get("http://localhost:3000/products");
                    const productOptions = products.map(p => ({
                        value: p.id,
                        label: `${p.name} (Stock: ${p.stock})`
                    }));

                    const { value: data, isConfirmed } = await Swal.fire({
                        title: "Nueva Compra",
                        html: `
                          <select id="swal-product-id" class="swal2-input" required>
                            ${productOptions.map(p => `<option value="${p.value}">${p.label}</option>`).join('')}
                          </select>
                          <input id="swal-purchase-quantity" class="swal2-input" placeholder="Cantidad" type="number" required>
                        `,
                        focusConfirm: false,
                        showCancelButton: true,
                        preConfirm: () => ({
                            productId: document.getElementById("swal-product-id").value,
                            quantity: document.getElementById("swal-purchase-quantity").value,
                        })
                    });

                    if (isConfirmed) {
                        await patch("http://localhost:3000/purchases", "new", data);
                        Swal.fire("Compra Agregada", "Compra agregada correctamente", "success");
                        getDashboardData();
                    }
                });
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
        productsTable?.addEventListener("click", async (e) => {
            const editBtn = e.target.closest("button[data-edit-id]");
            const deleteBtn = e.target.closest("button[data-delete-id]");

            if (editBtn) {
                const id = editBtn.dataset.editId;
                const product = products.find((p) => p.id == id);

                const { value: data, isConfirmed } = await Swal.fire({
                    title: "Editar Producto",
                    html: `
                      <input id="swal-product-name" class="swal2-input" placeholder="Nombre del Producto" value="${product.name}">
                      <input id="swal-product-description" class="swal2-input" placeholder="Descripción" value="${product.description}">
                      <input id="swal-product-price" class="swal2-input" placeholder="Precio" type="number" value="${product.price}">
                      <input id="swal-product-stock" class="swal2-input" placeholder="Stock" type="number" value="${product.stock}">
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    preConfirm: () => ({
                        name: document.getElementById("swal-product-name").value,
                        description: document.getElementById("swal-product-description").value,
                        price: document.getElementById("swal-product-price").value,
                        stock: document.getElementById("swal-product-stock").value,
                    })
                });

                if (isConfirmed) {
                    await update("http://localhost:3000/products", id, data);
                    Swal.fire("Actualizado", "Producto modificado", "success");
                    getDashboardData();
                }
            }

            // Dentro del listener de productsTable
            if (deleteBtn) {
                const id = deleteBtn.dataset.deleteId;
                const product = products.find((p) => p.id == id);
                Swal.fire({
                    title: "¿Estás seguro?",
                    text: `¿Quieres eliminar el producto?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await deletes(`http://localhost:3000/products/${id}`);
                        Swal.fire("Eliminado", "Producto eliminado correctamente", "success");
                        getDashboardData();
                    }
                });
            }
        });
        purchasesTable?.addEventListener("click", async (e) => {
            const editBtn = e.target.closest("button[data-edit-id]");
            const deleteBtn = e.target.closest("button[data-delete-id]");

            if (editBtn) {
                const id = editBtn.dataset.editId;
                const purchase = purchases.find((p) => p.id == id);

                const products = await get("http://localhost:3000/products");
                const productOptions = products.map(p => ({
                    value: p.id,
                    label: `${p.name} (Stock: ${p.stock})`
                }));

                const { value: data, isConfirmed } = await Swal.fire({
                    title: "Editar Compra",
                    html: `
                      <select id="swal-product-id" class="swal2-input" required>
                        ${productOptions.map(p => `<option value="${p.value}" ${p.value == purchase.productId ? 'selected' : ''}>${p.label}</option>`).join('')}
                      </select>
                      <input id="swal-purchase-quantity" class="swal2-input" placeholder="Cantidad" type="number" value="${purchase.quantity}">
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    preConfirm: () => ({
                        productId: document.getElementById("swal-product-id").value,
                        quantity: document.getElementById("swal-purchase-quantity").value,
                    })
                });

                if (isConfirmed) {
                    await update("http://localhost:3000/purchases", id, data);
                    Swal.fire("Actualizado", "Compra modificada", "success");
                    getDashboardData();
                }
            }

            // Dentro del listener de purchasesTable
            if (deleteBtn) {
                const id = deleteBtn.dataset.deleteId;
                const purchase = purchases.find((p) => p.id == id);
                Swal.fire({
                    title: "¿Estás seguro?",
                    text: `¿Quieres eliminar la compra?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await deletes(`http://localhost:3000/purchases/${id}`);
                        Swal.fire("Eliminado", "Compra eliminada correctamente", "success");
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