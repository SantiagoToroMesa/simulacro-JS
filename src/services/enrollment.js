import { get, post } from "./api";
import { getCurrentUser } from "./auth";

export async function enrollUser(courseId) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error("Usuario no autenticado");
    const enrollments = await get("http://localhost:3000/enrollments");
    const alreadyEnrolled = enrollments.some(e => e.userId === currentUser.id && e.courseId === courseId);
    if (alreadyEnrolled) throw new Error("Ya estás matriculado en este curso");
    return await post("http://localhost:3000/enrollments", {
        userId: currentUser.id,
        courseId
    });
}