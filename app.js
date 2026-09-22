// REEMPLAZA ESTO CON LA URL QUE TE DÉ GOOGLE APPS SCRIPT AL DESPLEGAR
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzD6jT1CP7Og4HfmFFG9xNnTJEwS7BMuvb9p1yMpiI--HnGcWv1Gb1GWylbuTVYmFgf6A/exec"; 

// DOM Elements
const columns = document.querySelectorAll('.kanban-column');
const form = document.getElementById('taskForm');

// Event Listeners para Drag and Drop en Columnas
columns.forEach(col => {
    col.addEventListener('dragover', e => {
        e.preventDefault(); // Necesario para permitir el drop
        col.parentElement.classList.add('ring-2', 'ring-indigo-400');
    });
    
    col.addEventListener('dragleave', e => {
        col.parentElement.classList.remove('ring-2', 'ring-indigo-400');
    });
    
    col.addEventListener('drop', e => {
        e.preventDefault();
        col.parentElement.classList.remove('ring-2', 'ring-indigo-400');
        
        const taskId = e.dataTransfer.getData('text/plain');
        const card = document.getElementById(taskId);
        const newStatus = col.parentElement.getAttribute('data-status');
        
        if (card && newStatus) {
            col.appendChild(card); // Mover UI inmediatamente para buena experiencia
            actualizarEstadoAPI(taskId, newStatus); // Llamada asíncrona al backend
        }
    });
});

// Cargar tareas iniciales
async function cargarTareas() {
    try {
        const response = await fetch(GAS_API_URL);
        const tareas = await response.json();
        
        tareas.forEach(tarea => {
            crearTarjetaUI(tarea);
        });
    } catch (error) {
        console.error("Error al cargar tareas:", error);
    }
}

// Crear Tarjeta en el DOM
function crearTarjetaUI(tarea) {
    const card = document.createElement('div');
    card.className = "card bg-white p-4 rounded shadow cursor-grab border-l-4 border-indigo-500 hover:shadow-md transition";
    card.draggable = true;
    card.id = tarea.ID;

    card.innerHTML = `
        <h3 class="font-bold text-gray-800 text-sm mb-1">${tarea.Titulo}</h3>
        <p class="text-xs text-gray-500 mb-3 line-clamp-2">${tarea.Descripcion}</p>
        <div class="flex justify-between items-center mb-2">
            <span class="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-1 rounded">👤 ${tarea.Responsable}</span>
        </div>
        <div class="text-[10px] text-gray-400 flex justify-between">
            <span>📅 ${tarea.FechaInicio} - ${tarea.FechaFin}</span>
        </div>
        ${tarea.URL ? `<a href="${tarea.URL}" target="_blank" class="text-xs text-blue-500 hover:underline mt-2 inline-block">🔗 Ver Entregable</a>` : ''}
    `;

    // Eventos Drag Card
    card.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', card.id);
        setTimeout(() => card.classList.add('dragging'), 0);
    });
    
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });

    const columna = document.getElementById(`col-${tarea.Estado}`);
    if (columna) columna.appendChild(card);
}

// Enviar Nueva Tarea al Backend
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = form.querySelector('button[type="submit"]');
    btnSubmit.innerText = "Guardando...";
    btnSubmit.disabled = true;

    const data = {
        action: 'crear',
        titulo: document.getElementById('titulo').value,
        descripcion: document.getElementById('descripcion').value,
        responsable: document.getElementById('responsable').value,
        fechaInicio: document.getElementById('fechaInicio').value,
        fechaFin: document.getElementById('fechaFin').value,
        url: document.getElementById('url').value
    };

    try {
        // NOTA TÉCNICA: Usamos 'text/plain' para evitar el error de preflight CORS en Google Apps Script
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(data)
        });
        
        const res = await response.json();
        if (res.success) {
            data.ID = res.id;
            data.Estado = 'Backlog';
            crearTarjetaUI(data); // Renderizar nueva tarea
            document.getElementById('taskModal').classList.add('hidden');
            form.reset();
        }
    } catch (error) {
        alert("Error al guardar la tarea");
    } finally {
        btnSubmit.innerText = "Crear Tarjeta";
        btnSubmit.disabled = false;
    }
});

// Actualizar estado (Al hacer Drag & Drop)
async function actualizarEstadoAPI(id, nuevoEstado) {
    const data = { action: 'actualizarEstado', id: id, estado: nuevoEstado };
    
    try {
        await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(data)
        });
        // Si el estado es "En revisión", GAS se encarga de enviar el correo silenciosamente.
    } catch (error) {
        console.error("Error al actualizar estado:", error);
    }
}

// Iniciar aplicación
cargarTareas();
