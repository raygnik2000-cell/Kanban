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

// Crear Tarjeta en el DOM (Estilo Dark Mode Pro)
function crearTarjetaUI(tarea) {
    const card = document.createElement('div');
    card.className = "card bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl shadow-lg cursor-grab active:cursor-grabbing hover:shadow-cyan-950/30 transition group";
    card.draggable = true;
    card.id = tarea.ID;

    // Badge según la primera letra del nombre
    const initial = tarea.Responsable ? tarea.Responsable.charAt(0).toUpperCase() : '?';

    card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold text-slate-200 text-sm group-hover:text-cyan-300 transition line-clamp-2">${tarea.Titulo}</h3>
        </div>
        
        <p class="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">${tarea.Descripcion}</p>
        
        <div class="flex items-center justify-between pt-3 border-t border-slate-800/80">
            <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold">
                    ${initial}
                </div>
                <span class="text-xs text-slate-300 font-medium">${tarea.Responsable}</span>
            </div>
            
            <span class="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                ${tarea.FechaFin}
            </span>
        </div>

        ${tarea.URL ? `
            <a href="${tarea.URL}" target="_blank" class="mt-3 flex items-center justify-center gap-1.5 w-full text-xs font-mono text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 py-1.5 rounded-lg transition">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                Ver Entregable
            </a>
        ` : ''}
    `;

    // Eventos Drag & Drop
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
