import { update, post } from "./api";
import {getDashboardData} from "./dashboard";
export async function addProduct() {
    const { value: formValues } = await Swal.fire({
        title: 'Add a new product',
        html: `
            <input type="text" id="productTitle" class="swal2-input" placeholder="Product Title">
            <textarea id="productDescription" class="swal2-input" placeholder="Description"></textarea>
            <input type="number" id="productPrice" class="swal2-input" placeholder="Price">
            <input type="number" id="productStock" class="swal2-input" placeholder="Stock">
        `,
        focusConfirm: false,
        preConfirm: () => {
            const title = document.getElementById('productTitle').value.trim();
            const description = document.getElementById('productDescription').value.trim();
            const price = document.getElementById('productPrice').value.trim();
            const stock = document.getElementById('productStock').value.trim();

            if (!title || !description || !price || !stock) {
                Swal.showValidationMessage('all fields are required');
                return null;
            }
            return [title, description, price, stock];
        }
    });

    if (formValues) {
        const [title, description, price, stock] = formValues;
        await post('http://localhost:3000/products', {
            title,
            description,
            price,
            stock
        });
        Swal.fire('Product added', '', 'success');
        const existingBtn = document.getElementById("add-course-btn");
        if (existingBtn) existingBtn.remove();
        getDashboardData();
    }
}