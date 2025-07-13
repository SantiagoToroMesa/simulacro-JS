import { update, post } from "./api";
import {getDashboardData} from "./dashboard";
export async function addCourse() {
    const { value: formValues } = await Swal.fire({
        title: 'Add a new course',
        html: `
            <input type="text" id="courseTitle" class="swal2-input" placeholder="Course Title">
            <textarea id="courseDescription" class="swal2-input" placeholder="Description"></textarea>
            <input type="date" id="courseStartDate" class="swal2-input" placeholder="Start Date">
            <input type="text" id="courseDuration" class="swal2-input" placeholder="Duration">
        `,
        focusConfirm: false,
        preConfirm: () => {
            const title = document.getElementById('courseTitle').value.trim();
            const description = document.getElementById('courseDescription').value.trim();
            const startDate = document.getElementById('courseStartDate').value.trim();
            const duration = document.getElementById('courseDuration').value.trim();

            if (!title || !description || !startDate || !duration) {
                Swal.showValidationMessage('all fields are required');
                return null;
            }
            return [title, description, startDate, duration];
        }
    });

    if (formValues) {
        const [title, description, startDate, duration] = formValues;
        await post('http://localhost:3000/courses', {
            title,
            description,
            startDate,
            duration
        });
        Swal.fire('Curse added', '', 'success');
        const existingBtn = document.getElementById("add-course-btn");
        if (existingBtn) existingBtn.remove();
        getDashboardData();
    }
}