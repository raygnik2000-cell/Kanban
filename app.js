// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBEZkGjUe7UYz3pGpvHgZt-Y35yH_948gI",
  authDomain: "lms-kanban.firebaseapp.com",
  projectId: "lms-kanban",
  storageBucket: "lms-kanban.firebasestorage.app",
  messagingSenderId: "968740905716",
  appId: "1:968740905716:web:dc698577bc2730927b34a1",
  measurementId: "G-V5HG9S6GQR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


// Funciones para abrir y cerrar Modales
function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        const content = modal.querySelector('div');
        if (content) content.classList.remove('scale-95');
    }, 10);
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('opacity-0');
    const content = modal.querySelector('div');
    if (content) content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// Recuentos y métricas en el Header y Columnas
function actualizarContadores() {
    const columns = document.querySelectorAll('.kanban-column');
    let totalTarjetas = 0;
    let totalRevision = 0;
    let totalDone = 0;

    columns.forEach(col => {
        const totalColumna = col.querySelectorAll('.card, .task-card').length;
        totalTarjetas += totalColumna;

        const status = col.getAttribute('data-status') || col.id.replace('col-', '');
        
        if (status.toLowerCase().includes('revisión') || status.toLowerCase().includes('revision')) {
            totalRevision += totalColumna;
        }
        if (status.toLowerCase().includes('finalizado') || status.toLowerCase().includes('done')) {
            totalDone += totalColumna;
        }

        // Actualizar Badge por columna (soporta count-Backlog, count-Asignado, etc.)
        const badge = document.getElementById(`count-${status}`) || document.getElementById(`count-${col.id.replace('col-', '')}`);
        if (badge) badge.innerText = totalColumna;
    });

    // Actualizar Métrica Global en el Header
    if (document.getElementById('task-count')) document.getElementById('task-count').innerText = totalTarjetas;
    if (document.getElementById('stat-total')) document.getElementById('stat-total').innerText = totalTarjetas;
    if (document.getElementById('stat-revision')) document.getElementById('stat-revision').innerText = totalRevision;
    if (document.getElementById('stat-done')) document.getElementById('stat-done').innerText = totalDone;
}

// Configuración de Drag & Drop
function inicializarDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(col => {
        col.addEventListener('dragover', e => {
            e.preventDefault();
            col.classList.add('drag-over');
        });

        col.addEventListener('dragleave', e => {
            col.classList.remove('drag-over');
        });

        col.addEventListener('drop', e => {
            e.preventDefault();
            col.classList.remove('drag-over');

            const taskId = e.dataTransfer.getData('text/plain');
            const card = document.getElementById(taskId);
            
            // Determinar nuevo estado según la columna de destino
            let newStatus = col.getAttribute('data-status');
            if (!newStatus) {
                const idClean = col.id.replace('col-', '');
                if (idClean === 'backlog') newStatus = 'Backlog';
                else if (idClean === 'asignado') newStatus = 'Asignado a';
                else if (idClean === 'en-progreso') newStatus = 'En progreso';
                else if (idClean === 'en-revision') newStatus = 'En revisión';
                else if (idClean === 'finalizado') newStatus = 'Finalizado';
            }

            if (card && newStatus) {
                col.appendChild(card);
                actualizarEstadoAPI(taskId, newStatus);
                actualizarContadores();
            }
        });
    });
}

// Cargar Tarjetas desde Google Sheets
async function cargarTareas() {
    try {
        const response = await fetch(GAS_API_URL);
        const tareas = await response.json();
        
        // Limpiar columnas
        document.querySelectorAll('.kanban-column').forEach(c => c.innerHTML = '');

        tareas.forEach(tarea => {
            crearTarjetaUI(tarea);
        });

        actualizarContadores();
    } catch (error) {
        console.error("Error al cargar tareas:", error);
    }
}

// Renderizado de Tarjeta en el DOM
function crearTarjetaUI(tarea) {
    const card = document.createElement('div');
    card.className = "card task-card bg-[#111625] border border-slate-800 p-4 rounded-xl shadow-md cursor-grab active:cursor-grabbing relative group hover:border-indigo-500/50 transition-all";
    card.draggable = true;
    card.id = tarea.ID;

    card.innerHTML = `
        <div class="flex justify-between items-start mb-1.5">
            <h3 class="font-bold text-slate-200 text-sm flex-1 pr-2 leading-snug">${tarea.Titulo || tarea.titulo || ''}</h3>
            <button onclick="eliminarTarjeta('${tarea.ID}')" title="Eliminar tarjeta" class="text-slate-500 hover:text-red-400 transition p-1 rounded">
                🗑️
            </button>
        </div>
        <p class="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">${tarea.Descripcion || tarea.descripcion || ''}</p>
        
        <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 font-mono text-xs">
            <span class="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] px-2 py-0.5 rounded-md">
                👤 ${tarea.Responsable || tarea.responsable || 'Sin asignar'}
            </span>
            <span class="text-[10px] text-slate-500">
                ${tarea.FechaFin || tarea.fechaFin || ''}
            </span>
        </div>

        ${(tarea.URL || tarea.url) ? `
            <a href="${tarea.URL || tarea.url}" target="_blank" class="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-mono text-indigo-400 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/40 py-1 rounded-lg transition">
                🔗 Ver Entregable
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

    // Mapeo flexible de la columna según el estado
    let targetCol = null;
    const estado = tarea.Estado || tarea.estado || 'Backlog';

    document.querySelectorAll('.kanban-column').forEach(col => {
        const statusAttr = col.getAttribute('data-status');
        if (statusAttr && statusAttr.toLowerCase() === estado.toLowerCase()) {
            targetCol = col;
        }
    });

    // Fallback por ID de columna
    if (!targetCol) {
        if (estado.includes('Backlog')) targetCol = document.getElementById('col-backlog') || document.getElementById('col-Backlog');
        else if (estado.includes('Asignado')) targetCol = document.getElementById('col-asignado') || document.getElementById('col-Asignado a');
        else if (estado.includes('Progreso')) targetCol = document.getElementById('col-en-progreso') || document.getElementById('col-En progreso');
        else if (estado.includes('Revisión') || estado.includes('Revision')) targetCol = document.getElementById('col-en-revision') || document.getElementById('col-En revisión');
        else if (estado.includes('Finalizado')) targetCol = document.getElementById('col-finalizado') || document.getElementById('col-Finalizado');
    }

    if (targetCol) {
        targetCol.appendChild(card);
    }
}

// Eliminar Tarjeta
async function eliminarTarjeta(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarjeta?")) return;

    const card = document.getElementById(id);
    if (card) {
        card.remove();
        actualizarContadores();
    }

    try {
        await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'eliminar', id: id })
        });
    } catch (error) {
        console.error("Error al eliminar tarjeta:", error);
    }
}

// Enviar / Crear Nueva Tarea en Google Sheets
async function guardarNuevaTarea(e) {
    e.preventDefault();

    // Detección adaptable de campos para ambos diseños HTML
    const tituloInput = document.getElementById('task-title') || document.getElementById('titulo');
    const descInput = document.getElementById('task-desc') || document.getElementById('descripcion');
    const respInput = document.getElementById('task-assignee') || document.getElementById('responsable') || document.getElementById('task-assignee');
    const fechaInicioInput = document.getElementById('fechaInicio');
    const fechaFinInput = document.getElementById('task-due-date') || document.getElementById('fechaFin');
    const urlInput = document.getElementById('url');
    const statusInput = document.getElementById('task-status');

    const formElement = e.target;
    const btnSubmit = formElement.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.innerText = "Guardando...";
        btnSubmit.disabled = true;
    }

    const data = {
        action: 'crear',
        titulo: tituloInput ? tituloInput.value : '',
        descripcion: descInput ? descInput.value : '',
        responsable: respInput ? respInput.value : '',
        fechaInicio: fechaInicioInput ? fechaInicioInput.value : new Date().toISOString().split('T')[0],
        fechaFin: fechaFinInput ? fechaFinInput.value : '',
        url: urlInput ? urlInput.value : '',
        estado: statusInput ? statusInput.value : 'Backlog'
    };

    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(data)
        });

        const res = await response.json();
        if (res.success) {
            const nuevaTarea = {
                ID: res.id,
                Titulo: data.titulo,
                Descripcion: data.descripcion,
                Responsable: data.responsable,
                FechaInicio: data.fechaInicio,
                FechaFin: data.fechaFin,
                URL: data.url,
                Estado: data.estado
            };

            crearTarjetaUI(nuevaTarea);
            actualizarContadores();

            // Cerrar modal
            const modalTask = document.getElementById('modal-task') || document.getElementById('taskModal');
            closeModal(modalTask);
            formElement.reset();
        }
    } catch (error) {
        console.error("Error al crear la tarjeta:", error);
        alert("Ocurrió un error al guardar la tarjeta en Google Sheets.");
    } finally {
        if (btnSubmit) {
            btnSubmit.innerText = "Guardar Tarjeta";
            btnSubmit.disabled = false;
        }
    }
}

// Actualizar Estado en Apps Script tras arrastrar y soltar
async function actualizarEstadoAPI(id, nuevoEstado) {
    try {
        await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'actualizarEstado', id: id, estado: nuevoEstado })
        });
    } catch (error) {
        console.error("Error al actualizar estado:", error);
    }
}

// Inicialización de Eventos de la App al Cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Drag & Drop
    inicializarDragAndDrop();

    // Escuchar Modales de Creación de Tarjetas
    const btnOpenTaskModal = document.getElementById('btn-open-modal');
    const modalTask = document.getElementById('modal-task') || document.getElementById('taskModal');
    const btnCloseTaskModal = document.getElementById('btn-close-modal') || document.getElementById('btn-cancel-modal');
    const formTask = document.getElementById('form-task') || document.getElementById('taskForm');

    btnOpenTaskModal?.addEventListener('click', () => openModal(modalTask));
    btnCloseTaskModal?.addEventListener('click', () => closeModal(modalTask));
    document.getElementById('btn-cancel-modal')?.addEventListener('click', () => closeModal(modalTask));

    // Event Listener del Formulario de Tarjetas
    formTask?.addEventListener('submit', guardarNuevaTarea);

    // --- EVENTOS DE AUTENTICACIÓN (FIREBASE) ---
    const modalLogin = document.getElementById('modal-login');
    const modalRegister = document.getElementById('modal-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    document.getElementById('btn-open-login')?.addEventListener('click', () => openModal(modalLogin));
    document.getElementById('btn-close-login')?.addEventListener('click', () => closeModal(modalLogin));
    document.getElementById('btn-open-register')?.addEventListener('click', () => openModal(modalRegister));
    document.getElementById('btn-close-register')?.addEventListener('click', () => closeModal(modalRegister));

    if (auth) {
        auth.onAuthStateChanged((user) => {
            const authSection = document.getElementById('user-auth-section');
            const loggedSection = document.getElementById('user-logged-section');
            const displayName = document.getElementById('user-display-name');

            if (user) {
                authSection?.classList.add('hidden');
                loggedSection?.classList.remove('hidden');
                if (displayName) displayName.textContent = user.displayName || user.email;
            } else {
                authSection?.classList.remove('hidden');
                loggedSection?.classList.add('hidden');
                if (displayName) displayName.textContent = '';
            }
        });

        formLogin?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            try {
                await auth.signInWithEmailAndPassword(email, password);
                closeModal(modalLogin);
                formLogin.reset();
            } catch (err) {
                alert("Error al iniciar sesión: " + err.message);
            }
        });

        formRegister?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            try {
                const cred = await auth.createUserWithEmailAndPassword(email, password);
                await cred.user.updateProfile({ displayName: name });
                closeModal(modalRegister);
                formRegister.reset();
            } catch (err) {
                alert("Error al registrarse: " + err.message);
            }
        });

        document.getElementById('btn-logout')?.addEventListener('click', () => auth.signOut());
    }

    // Cargar tarjetas de Google Sheets
    cargarTareas();
});
