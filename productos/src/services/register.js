import {get, post} from "./api";
import {navigate} from "../main";

function generateEnrollNumber(){
    const timestamp = Date.now();
    const random = Math.floor(Math.random()*1000);
    return `${timestamp}${random}`
};

async function uniqueEnrollNumber(){
    const data = await get("http://localhost:3000/users");
    let enrollNumber
    do{
        enrollNumber = generateEnrollNumber();
    } while(data.find(u => u.enrollNumber === enrollNumber));
    return enrollNumber;
};

export async function setupRegister() {
    const form = document.getElementById("register-form");
    const msg = document.getElementById("register-msg");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const enrollNumber = await uniqueEnrollNumber();
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const role = "user"

        if (!name || !email || !password || !phone) {
            msg.textContent = "Por favor completa todos los campos.";
            return;
        }

        const users = await get("http://localhost:3000/users");

        const alreadyExists = users.find(user => user.email === email);

        if (alreadyExists) {
            msg.textContent = "Ya existe un usuario con ese correo.";
            return;
        }

        const newUser = {
            id: String(Date.now()), // o que lo maneje json-server automáticamente
            name,
            email,
            password,
            role: role,
            phone,
            enrrollNumber: enrollNumber,
            dateOfAdmission: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        };

        await post("http://localhost:3000/users", newUser);

        localStorage.setItem("user", JSON.stringify(newUser));
        navigate("/public"); // o donde lo quieras redirigir después del registro
    });
}