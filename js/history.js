// ==========================================
// 8. history.js - AUTOGUARDADO EN INDEXEDDB
// ==========================================

const HistoryDB = {
    db: null,
    init: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SpriteGenHistoryDB', 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('sessions')) {
                    db.createObjectStore('sessions', { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };
            request.onerror = (e) => reject(e);
        });
    },
    saveSession: function(data) {
        if(!this.db) return;
        // Use a unique combination of appMode and fileName so multiple files can be saved
        data.id = data.appMode + '_' + (data.fileName || 'unknown');
        data.timestamp = new Date().getTime();
        const tx = this.db.transaction('sessions', 'readwrite');
        tx.objectStore('sessions').put(data);
    },
    loadAllSessions: function() {
        return new Promise((resolve, reject) => {
            if(!this.db) return resolve([]);
            const tx = this.db.transaction('sessions', 'readonly');
            const request = tx.objectStore('sessions').getAll();
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e);
        });
    },
    loadSessionById: function(id) {
        return new Promise((resolve, reject) => {
            if(!this.db) return resolve(null);
            const tx = this.db.transaction('sessions', 'readonly');
            const request = tx.objectStore('sessions').get(id);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e);
        });
    },
    deleteSession: function(id) {
        return new Promise((resolve, reject) => {
            if(!this.db) return resolve();
            const tx = this.db.transaction('sessions', 'readwrite');
            const request = tx.objectStore('sessions').delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e);
        });
    }
};

window.addEventListener('DOMContentLoaded', () => {
    HistoryDB.init().catch(console.error);
});

window.autoSaveHistory = function() {
    if(!HistoryDB.db) return;
    
    let fileName = "Sesión sin nombre";
    if(window.appMode === 'SCAN' || window.appMode === 'EDIT' || window.appMode === 'COMPRESS' || window.appMode === 'PSYCH') {
        if (window.nombreArchivo) fileName = window.nombreArchivo;
    } else if (window.appMode === 'AUDIO') {
        if (window.oggFileName) fileName = window.oggFileName;
    } else if (window.appMode === 'ATLAS') {
        if (window.atlasPngFileName) fileName = window.atlasPngFileName;
    }

    let data = {
        appMode: window.appMode || 'HOME',
        dateString: new Date().toLocaleString(),
        fileName: fileName
    };
    
    // Guardar estado del editor / escaner
    if(window.imgOriginal && window.imgOriginal.src && window.imgOriginal.src.startsWith('data:')) {
        data.imgSrc = window.imgOriginal.src;
        data.sprites = window.spritesDetectados || [];
    }
    
    // Guardar estado de Audio OGG
    if(window.appMode === 'AUDIO' && window.oggFileOriginal) {
        data.audioFile = window.oggFileOriginal; 
    }
    
    // Guardar estado de Atlas
    if(window.appMode === 'ATLAS') {
        if(window.atlasAnimObj) data.atlasAnimObj = window.atlasAnimObj;
        if(window.atlasJsonObj) data.atlasJsonObj = window.atlasJsonObj;
        if(window.atlasPngImg && window.atlasPngImg.src.startsWith('data:')) data.atlasPngImgSrc = window.atlasPngImg.src;
    }
    
    HistoryDB.saveSession(data);
};

window.showHistoryModal = async function() {
    let mod = document.getElementById('historyModal');
    let content = document.getElementById('historyModalContent');
    if(!mod || !content) return;
    
    content.innerHTML = '<div style="text-align:center"><div class="ia-spinner" style="margin: 20px auto; width: 40px; height: 40px;"></div> Buscando sesión...</div>';
    mod.style.display = 'flex';
    
    let sessions = await HistoryDB.loadAllSessions();
    if(!sessions || sessions.length === 0) {
        content.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No hay sesiones activas guardadas.</p>';
        return;
    }
    
    // Sort by timestamp descending (newest first)
    sessions.sort((a, b) => b.timestamp - a.timestamp);
    
    let html = '';
    
    for(let session of sessions) {
        if(session.appMode === 'HOME') continue;
        
        let modoNombre = session.appMode;
        if(modoNombre === 'SCAN') modoNombre = "Escaner de Cero";
        if(modoNombre === 'EDIT') modoNombre = "Secuenciador / Afinador";
        if(modoNombre === 'COMPRESS') modoNombre = "Optimizador de PNG";
        if(modoNombre === 'AUDIO') modoNombre = "Compresor OGG";
        if(modoNombre === 'ATLAS') modoNombre = "Conversor Atlas";
        if(modoNombre === 'PSYCH') modoNombre = "Psych Character Builder";
        
        let nombreArchivoStr = session.fileName ? session.fileName : "Sesión Guardada";
        
        html += `
            <div style="background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); padding: 15px; border-radius: 12px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; flex-direction:column; text-align:left;">
                        <b style="color:var(--text); font-size: 1.1rem;">${modoNombre}</b>
                        <span style="font-size: 0.85rem; color: var(--accent); font-weight:bold; word-break: break-all;">Archivo: ${nombreArchivoStr}</span>
                    </div>
                    <span style="font-size:0.8rem; color:var(--text-muted);">${session.dateString}</span>
                </div>
                <div style="display:flex; gap: 10px; margin-top: 10px;">
                    <button class="btn-pildora" onclick="restoreHistorySession('${session.id}')" style="flex: 1;">Continuar Sesión</button>
                    <button class="btn-pildora" onclick="deleteHistorySession('${session.id}')" style="flex: 1; background: linear-gradient(135deg, #ff4757, #ff6b81);"><img src="https://cdn-icons-png.flaticon.com/128/3405/3405244.png" class="icon-sm icon-white" alt="Eliminar"> Eliminar</button>
                </div>
            </div>
        `;
    }
    
    if(html === '') {
        html = '<p style="text-align:center; color:var(--text-muted);">No hay sesiones activas guardadas.</p>';
    }
    
    content.innerHTML = html;
};

window.closeHistoryModal = function() {
    let mod = document.getElementById('historyModal');
    if(mod) mod.style.display = 'none';
};

window.restoreHistorySession = async function(id) {
    closeHistoryModal();
    let session = await HistoryDB.loadSessionById(id);
    if(!session) return;
    
    if(typeof showLoader === 'function') showLoader("RESTAURANDO", "Cargando sesión previa...");
    
    try {
        if(session.appMode === 'SCAN' || session.appMode === 'EDIT' || session.appMode === 'COMPRESS' || session.appMode === 'PSYCH') {
            if(session.imgSrc) {
                window.imgOriginal = new Image();
                window.imgOriginal.onload = () => {
                    window.spritesDetectados = session.sprites || [];
                    let canvas = document.getElementById('canvasSprites');
                    if(canvas) {
                        canvas.width = window.imgOriginal.width; 
                        canvas.height = window.imgOriginal.height;
                    }
                    if(typeof window.dibujarContornos === 'function') window.dibujarContornos();
                    if(typeof window.renderTimelineSecuenciador === 'function') window.renderTimelineSecuenciador();
                    if(typeof window.actualizarDropdownFiltros === 'function') window.actualizarDropdownFiltros();
                    if(typeof window.actualizarDropdownPsych === 'function') window.actualizarDropdownPsych();
                    
                    if(typeof window.initMode === 'function') window.initMode(session.appMode);
                    ocultarCargaGlobal();
                };
                window.imgOriginal.src = session.imgSrc;
            } else {
                if(typeof window.initMode === 'function') window.initMode(session.appMode);
                ocultarCargaGlobal();
            }
        } 
        else if (session.appMode === 'AUDIO') {
            if(session.audioFile) {
                window.oggFileOriginal = session.audioFile;
                window.oggFileName = session.audioFile.name;
                document.getElementById('txtAudioOrigSize').textContent = (session.audioFile.size / 1024 / 1024).toFixed(2) + " MB";
                document.getElementById('btnDownloadAudio').style.display = 'none';
                document.getElementById('btnRunAudio').style.display = 'block';
                if(typeof window.detectBPM === 'function') window.detectBPM(session.audioFile);
            }
            if(typeof window.initMode === 'function') window.initMode('AUDIO');
            ocultarCargaGlobal();
        }
        else if (session.appMode === 'ATLAS') {
            window.atlasAnimObj = session.atlasAnimObj || null;
            window.atlasJsonObj = session.atlasJsonObj || null;
            if(session.atlasPngImgSrc) {
                window.atlasPngImg = new Image();
                window.atlasPngImg.onload = () => {
                    if(typeof window.updateAtlasPreview === 'function') window.updateAtlasPreview();
                    ocultarCargaGlobal();
                };
                window.atlasPngImg.src = session.atlasPngImgSrc;
            } else {
                if(typeof window.updateAtlasPreview === 'function') window.updateAtlasPreview();
                ocultarCargaGlobal();
            }
            if(typeof window.initMode === 'function') window.initMode('ATLAS');
        } else {
            if(typeof window.initMode === 'function') window.initMode(session.appMode);
            ocultarCargaGlobal();
        }
    } catch(e) {
        console.error(e);
        ocultarCargaGlobal();
        alert("Error al restaurar la sesión.");
    }
};

window.deleteHistorySession = async function(id) {
    if(confirm("¿Estás seguro de que quieres eliminar la sesión guardada?")) {
        await HistoryDB.deleteSession(id);
        showHistoryModal(); // Refresh modal
    }
};
