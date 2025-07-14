export async function get(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data
    } catch (error) {
        console.error("Error en GET:", error);
    }
}

export async function post(url, body) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        return data
    } catch (error) {
        console.error("Error en POST:", error);
    }
}



export async function update(url, id, body) {
    try {
        // Obtener el usuario actual antes de actualizar
        const getResponse = await fetch(`${url}/${id}`);
        if (!getResponse.ok) {
            const message = await getResponse.text();
            throw new Error(`Error ${getResponse.status}: ${message}`);
        }
        const currentData = await getResponse.json();
        // Mezclar los datos actuales con los nuevos
        const updatedBody = { ...currentData, ...body };
        const response = await fetch(`${url}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedBody)
        });
        if (!response.ok) {
            // Leer el texto plano del error
            const message = await response.text();
            throw new Error(`Error ${response.status}: ${message}`);
        }
        const data = await response.json();
        console.log("PUT actualizado:", data);
        return data;
    } catch (error) {
        console.error("Error en PUT:", error);
        throw error;
    }
}


export async function deletes(url) {
    try {
        const response = await fetch(url, {
            method: "DELETE"
        });

        if (response.ok) {
            console.log("DELETE: recurso eliminado correctamente");
            return true;
        } else {
            console.error("Error al eliminar");
            return false;
        }
    } catch (error) {
        console.error("Error en DELETE:", error);
        throw error;
    }
}

export async function patch(url, id, body) {
    try {
        const response = await fetch(`${url}/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const message = await response.text();
            throw new Error(`Error ${response.status}: ${message}`);
        }
        const data = await response.json();
        console.log("PATCH actualizado:", data);
        return data;
    } catch (error) {
        console.error("Error en PATCH:", error);
        throw error;
    }
}
