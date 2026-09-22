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
