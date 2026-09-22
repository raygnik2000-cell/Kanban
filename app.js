// REEMPLAZA ESTO CON LA URL QUE TE DÉ GOOGLE APPS SCRIPT AL DESPLEGAR
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzD6jT1CP7Og4HfmFFG9xNnTJEwS7BMuvb9p1yMpiI--HnGcWv1Gb1GWylbuTVYmFgf6A/exec"; 

// DOM Elements
const columns = document.querySelectorAll('.kanban-column');
const form = document.getElementById('taskForm');

// Event Listeners para Drag and Drop en Columnas
columns.forEach(col => {
    col.addEventListener('dragover', e => {
        e.preventDefault();
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
            col.appendChild(card);
            actualizarEstadoAPI(taskId, newStatus);
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

// Crear Tarjeta en el DOM (con botón de eliminar)

// Crear Tarjeta en el DOM con diseño mejorado
function crearTarjetaUI(tarea) {
    const card = document.createElement('div');
    card.className = "card bg-white p-4 rounded-xl shadow-sm hover:shadow-md border border-slate-200/80 cursor-grab border-l-4 border-l-indigo-500 transition-all duration-200 relative group";
    card.draggable = true;
    card.id = tarea.ID;

    card.innerHTML = `
        <div class="flex justify-between items-start mb-1.5">
            <h3 class="font-semibold text-slate-800 text-sm flex-1 pr-2 leading-snug">${tarea.Titulo}</h3>
            <button onclick="eliminarTarjeta('${tarea.ID}')" title="Eliminar tarjeta" class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-slate-100">
                🗑️
            </button>
        </div>
        <p class="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">${tarea.Descripcion}</p>
        <div class="flex justify-between items-center mb-2.5">
            <span class="bg-indigo-50 text-indigo-700 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-indigo-100">👤 ${tarea.Responsable}</span>
        </div>
        <div class="text-[10px] text-slate-400 font-medium flex justify-between items-center pt-2 border-t border-slate-100">
            <span>📅 ${tarea.FechaInicio} — ${tarea.FechaFin}</span>
        </div>
        ${tarea.URL ? `
            <a href="${tarea.URL}" target="_blank" class="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline">
                🔗 <span>Ver Entregable</span>
            </a>
        ` : ''}
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

// Función para eliminar tarjeta
async function eliminarTarjeta(id) {
    const confirmacion = confirm("¿Estás seguro de que deseas eliminar esta tarjeta?");
    if (!confirmacion) return;

    const card = document.getElementById(id);
    if (card) {
        // Remover de la interfaz inmediatamente
        card.remove();
    }

    // Petición al backend para borrar la fila en Google Sheets
    try {
        await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'eliminar', id: id })
        });
    } catch (error) {
        console.error("Error al eliminar la tarjeta:", error);
        alert("Hubo un problema al eliminar la tarjeta de la base de datos.");
    }
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
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(data)
        });
        
        const res = await response.json();
        if (res.success) {
            data.ID = res.id;
            data.Estado = 'Backlog';
            crearTarjetaUI(data);
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
    } catch (error) {
        console.error("Error al actualizar estado:", error);
    }
}

// Iniciar aplicación
cargarTareas();
