// Configuración global
const SPRINT_MASTER_EMAIL = "sprintmaster@tu-dominio.com"; // Cambiar por el correo del Sprint Master
const SHEET_NAME = "Tarjetas";

/**
 * Endpoint GET: Retorna todas las tarjetas guardadas en la hoja de cálculo
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return responseJSON({ status: "error", message: "La pestaña 'Tarjetas' no existe" });
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return responseJSON([]);
    }
    
    const headers = data[0];
    const cards = data.slice(1).map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        if (row[index] instanceof Date) {
          obj[header] = Utilities.formatDate(row[index], Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else {
          obj[header] = row[index];
        }
      });
      return obj;
    });

    return responseJSON(cards);
  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  }
}

/**
 * Endpoint POST: Maneja movimientos y ediciones de tarjetas
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { accion, cardData } = body;

    if (!cardData || !cardData.id) {
      return responseJSON({ status: "error", message: "Falta información de la tarjeta (id es requerido)" });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Mapeo de índices de columna
    const idIdx = headers.indexOf("id");
    const tituloIdx = headers.indexOf("titulo");
    const descIdx = headers.indexOf("descripcion");
    const respIdx = headers.indexOf("responsable");
    const fInicioIdx = headers.indexOf("fechaInicio");
    const fFinIdx = headers.indexOf("fechaFin");
    const urlIdx = headers.indexOf("url");
    const estadoIdx = headers.indexOf("estado");

    if (idIdx === -1) {
      return responseJSON({ status: "error", message: "La columna 'id' no se encuentra en la hoja" });
    }

    let cardRow = -1;
    let datosAntiguos = {};

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx].toString() === cardData.id.toString()) {
        cardRow = i + 1; // Fila base 1
        datosAntiguos = {
          estado: data[i][estadoIdx],
          titulo: data[i][tituloIdx],
          responsable: data[i][respIdx],
          url: data[i][urlIdx]
        };
        break;
      }
    }

    if (cardRow === -1) {
      return responseJSON({ status: "error", message: "Tarjeta no encontrada con el ID indicado" });
    }

    // ACCIÓN 1: Mover tarjeta entre columnas
    if (accion === "mover") {
      sheet.getRange(cardRow, estadoIdx + 1).setValue(cardData.nuevoEstado);

      // Enviar correo si pasa a "En revisión"
      if (cardData.nuevoEstado === "En revisión" && datosAntiguos.estado !== "En revisión") {
        enviarNotificacionRevision({
          titulo: datosAntiguos.titulo,
          responsable: datosAntiguos.responsable,
          url: datosAntiguos.url
        });
      }
      return responseJSON({ status: "success", message: "Estado actualizado exitosamente" });
    }

    // ACCIÓN 2: Editar tarjeta completa
    if (accion === "editar") {
      if (tituloIdx !== -1) sheet.getRange(cardRow, tituloIdx + 1).setValue(cardData.titulo);
      if (descIdx !== -1) sheet.getRange(cardRow, descIdx + 1).setValue(cardData.descripcion);
      if (respIdx !== -1) sheet.getRange(cardRow, respIdx + 1).setValue(cardData.responsable);
      if (fInicioIdx !== -1) sheet.getRange(cardRow, fInicioIdx + 1).setValue(cardData.fechaInicio);
      if (fFinIdx !== -1) sheet.getRange(cardRow, fFinIdx + 1).setValue(cardData.fechaFin);
      if (urlIdx !== -1) sheet.getRange(cardRow, urlIdx + 1).setValue(cardData.url);
      if (estadoIdx !== -1 && cardData.estado) {
        const estadoAnterior = datosAntiguos.estado;
        sheet.getRange(cardRow, estadoIdx + 1).setValue(cardData.estado);
        
        if (cardData.estado === "En revisión" && estadoAnterior !== "En revisión") {
          enviarNotificacionRevision({
            titulo: cardData.titulo,
            responsable: cardData.responsable,
            url: cardData.url
          });
        }
      }

      return responseJSON({ status: "success", message: "Tarjeta editada correctamente" });
    }

    return responseJSON({ status: "error", message: "Acción no válida" });

  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  }
}

/**
 * Notificación por correo
 */
function enviarNotificacionRevision(card) {
  const asunto = `[LMS Kanban] Tarea lista para revisión: ${card.titulo}`;
  const cuerpoHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2563EB;">Nueva tarea en estado de Revisión</h2>
      <p>Hola Sprint Master,</p>
      <p>La siguiente tarea requiere tu validación:</p>
      <ul>
        <li><strong>Título:</strong> ${card.titulo}</li>
        <li><strong>Responsable:</strong> ${card.responsable || 'Sin asignar'}</li>
        <li><strong>Entregable / URL:</strong> <a href="${card.url}" target="_blank">${card.url || 'Sin enlace adjunto'}</a></li>
      </ul>
      <p style="margin-top: 20px;">Por favor, revisa el trabajo y actualiza la tarjeta a <strong>Finalizado</strong> o reasígnala si requiere ajustes.</p>
    </div>
  `;

  try {
    MailApp.sendEmail({
      to: SPRINT_MASTER_EMAIL,
      subject: asunto,
      htmlBody: cuerpoHtml
    });
  } catch (err) {
    console.error("Error al enviar email: " + err.toString());
  }
}

/**
 * Auxiliar para respuesta JSON
 */
function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
