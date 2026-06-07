// ==========================================
// CONFIGURACIÓN DE VERSIÓN Y MODALES
// ==========================================
const CURRENT_VERSION = '1.0'; 

window.onload = () => {
    const lastVersion = localStorage.getItem('iasprite_version');
    if (!lastVersion) {
        document.getElementById('welcomeModal').style.display = 'flex';
    } else if (lastVersion !== CURRENT_VERSION) {
        document.getElementById('changelogModal').style.display = 'flex';
    }
};

function closeWelcomeModal() {
    document.getElementById('welcomeModal').style.display = 'none';
    localStorage.setItem('iasprite_version', CURRENT_VERSION);
}

function closeChangelogModal() {
    document.getElementById('changelogModal').style.display = 'none';
    localStorage.setItem('iasprite_version', CURRENT_VERSION);
}

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let appMode = 'HOME'; 
let imgOriginal = new Image(); let nombreArchivo = "spritesheet.png";
let spritesDetectados = []; let psychAnimations = [];
let indexEditando = null;

// MOTOR DE VISTA CSS
let zoomActual = 1.0; 
let panX = 0, panY = 0;
let globalMode = 'VIEW'; 

// ELEMENTOS DEL DOM
const scanWrapper = document.getElementById('scanWrapper');
const canvas = document.getElementById('canvasSprites'); const ctx = canvas.getContext('2d');
const canvasPreview = document.getElementById('canvasPreview'); const ctxPreview = canvasPreview.getContext('2d');
const canvasLoopPlayer = document.getElementById('canvasLoopPlayer'); const ctxLoopPlayer = canvasLoopPlayer.getContext('2d');
const canvasPsychLive = document.getElementById('canvasPsychLive'); const ctxPsychLive = canvasPsychLive.getContext('2d');

const timelineContainer = document.getElementById('timelineContainer');
const selectAnimFilter = document.getElementById('selectAnimFilter');
const p_animPrefix = document.getElementById('p_animPrefix');
const psychAnimList = document.getElementById('psychAnimList');
const iaLoader = document.getElementById('iaLoader'); const iaStatusTxt = document.getElementById('iaStatusTxt');

let playActive = true; let playInterval = null; let currentLoopFrameIdx = 0; let fpsActual = 24;
let psychLiveActiveAnimIdx = -1; let psychLiveFrameIdx = 0; let psychLiveInterval = null;

document.getElementById('sliderCorte').addEventListener('input', (e) => document.getElementById('valCorte').textContent = e.target.value);
document.getElementById('sliderUnion').addEventListener('input', (e) => document.getElementById('valUnion').textContent = e.target.value);

// ==========================================
// AUTO-RENUMERADO SECUENCIAL
// ==========================================
function autoRenumerar() {
    let contadores = {};
    spritesDetectados.forEach(s => {
        let prefijo = s.name.replace(/\d+$/, '');
        if (!prefijo) prefijo = "frame_"; 
        if (contadores[prefijo] === undefined) contadores[prefijo] = 0;
        s.name = prefijo + String(contadores[prefijo]).padStart(4, '0');
        contadores[prefijo]++;
    });
}

// ==========================================
// DUPLICADOR INTELIGENTE
// ==========================================
function duplicateFrame(idx) {
    let original = spritesDetectados[idx];
    let copy = JSON.parse(JSON.stringify(original)); 
    spritesDetectados.splice(idx + 1, 0, copy); 

    if (indexEditando !== null && indexEditando > idx) { indexEditando++; }
    
    autoRenumerar(); renderTimelineSecuenciador(); dibujarContornos();
    actualizarDropdownFiltros(); actualizarDropdownPsych();
}

function duplicarActualAfinador() {
    if(indexEditando === null) return;
    duplicateFrame(indexEditando); seleccionarFrameAfinador(indexEditando + 1); 
}

// ==========================================
// NAVEGACIÓN Y APARICIÓN DE BOTONES
// ==========================================
function openWindow(winId) {
    document.querySelectorAll('.window-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.win-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(winId).classList.add('active');
    
    if(winId==='win-home') document.getElementById('navHome').classList.add('active');
    if(winId==='win-escaner') document.getElementById('navEscaner').classList.add('active');
    if(winId==='win-orden') document.getElementById('navOrden').classList.add('active');
    if(winId==='win-afinador') document.getElementById('navAfinador').classList.add('active');
    if(winId==='win-psych') document.getElementById('navPsych').classList.add('active');

    if(winId === 'win-afinador') { renderizarPreviewTiempoReal(); updatePlayerInterval(); }
    if(winId === 'win-orden') { renderTimelineSecuenciador(); }
    if(winId === 'win-psych') { startPsychLiveLoop(); }
    if(winId === 'win-escaner') { actualizarCSSCamera(); dibujarContornos(); }
}

function toggleNavButtons() {
    document.getElementById('navEscaner').style.display = (appMode === 'SCAN') ? 'flex' : 'none';
    document.getElementById('navOrden').style.display = (appMode === 'SCAN' || appMode === 'EDIT') ? 'flex' : 'none';
    document.getElementById('navAfinador').style.display = (appMode === 'SCAN' || appMode === 'EDIT') ? 'flex' : 'none';
    document.getElementById('navPsych').style.display = (appMode === 'PSYCH') ? 'flex' : 'none';
    
    document.getElementById('navPack').style.display = (appMode === 'EDIT' || appMode === 'SCAN') ? 'flex' : 'none';
    document.getElementById('navExport').style.display = (appMode !== 'HOME') ? 'flex' : 'none';
    
    if(appMode === 'PSYCH') {
        document.getElementById('navExport').innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/136/136443.png" class="icon" alt="JSON"> Generar JSON';
        document.getElementById('navExport').style.background = 'linear-gradient(135deg, #558800, #224400)';
    } else {
        document.getElementById('navExport').innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/2874/2874091.png" class="icon" alt="XML"> Solo Guardar XML';
        document.getElementById('navExport').style.background = 'linear-gradient(135deg, #008888, #005555)';
    }
}

function initMode(mode) { appMode = mode; toggleNavButtons(); if(mode === 'SCAN') openWindow('win-escaner'); }
const pensar = (ms) => new Promise(res => setTimeout(res, ms));
function showLoader(title, text) { document.getElementById('iaTitle').textContent = title; iaStatusTxt.innerHTML = text; iaLoader.style.display = 'flex'; }

// ==========================================
// CARGA DE IMÁGENES Y XML
// ==========================================
function loadMainImage(file, callback) {
    if(!file) return;
    showLoader("CARGANDO...", "Detectando imagen PNG...");
    nombreArchivo = file.name; 
    
    const reader = new FileReader();
    reader.onload = (event) => { 
        imgOriginal = new Image();
        imgOriginal.onload = () => { 
            spritesDetectados = []; 
            canvas.width = imgOriginal.width; 
            canvas.height = imgOriginal.height; 
            
            let rect = scanWrapper.getBoundingClientRect();
            let scaleX = (rect.width - 40) / imgOriginal.width; 
            let scaleY = (rect.height - 40) / imgOriginal.height;
            zoomActual = Math.min(1.0, scaleX, scaleY);
            if (zoomActual <= 0) zoomActual = 0.1; 
            
            panX = (rect.width - (imgOriginal.width * zoomActual)) / 2;
            panY = (rect.height - (imgOriginal.height * zoomActual)) / 2;
            
            actualizarCSSCamera();
            document.getElementById('iaLoader').style.display = 'none';
            if(callback) callback(); 
        }; 
        imgOriginal.onerror = () => {
            document.getElementById('iaLoader').style.display = 'none';
            alert("❌ Error al cargar la imagen. Asegúrate de que el formato termine con .png");
        }
        imgOriginal.src = event.target.result; 
    };
    reader.onerror = () => { document.getElementById('iaLoader').style.display = 'none'; alert("❌ Error al leer el archivo."); }
    reader.readAsDataURL(file);
}

document.getElementById('imageInputScan').addEventListener('change', (e) => {
    loadMainImage(e.target.files[0], () => { document.getElementById('btnProcesar').style.display = 'flex'; });
});

let tI2=null, tX2=null, tI3=null, tX3=null;
document.getElementById('modImage').addEventListener('change', e => { tI2 = e.target.files[0]; checkDual('EDIT'); });
document.getElementById('modXML').addEventListener('change', e => { tX2 = e.target.files[0]; checkDual('EDIT'); });
document.getElementById('psychImage').addEventListener('change', e => { tI3 = e.target.files[0]; checkDual('PSYCH'); });
document.getElementById('psychXML').addEventListener('change', e => { tX3 = e.target.files[0]; checkDual('PSYCH'); });

function checkDual(mode) {
    let imgF = mode === 'EDIT' ? tI2 : tI3; let xmlF = mode === 'EDIT' ? tX2 : tX3;
    if(imgF && xmlF) {
        appMode = mode; toggleNavButtons(); 
        loadMainImage(imgF, () => {
            let reader = new FileReader(); reader.onload = (e) => { parseSparrowXML(e.target.result); finalizarCargaGeneral(mode); }; reader.readAsText(xmlF);
        });
    }
}

function parseSparrowXML(xmlString) {
    let parser = new DOMParser(); let xmlDoc = parser.parseFromString(xmlString, "text/xml");
    let subTextures = xmlDoc.getElementsByTagName("SubTexture"); spritesDetectados = [];
    for(let i=0; i<subTextures.length; i++) {
        let st = subTextures[i]; let w = parseInt(st.getAttribute("width")); let h = parseInt(st.getAttribute("height"));
        spritesDetectados.push({
            name: st.getAttribute("name"), x: parseInt(st.getAttribute("x")), y: parseInt(st.getAttribute("y")), w: w, h: h,
            frameX: parseInt(st.getAttribute("frameX")) || 0, frameY: parseInt(st.getAttribute("frameY")) || 0,
            frameWidth: parseInt(st.getAttribute("frameWidth")) || w, frameHeight: parseInt(st.getAttribute("frameHeight")) || h,
            angle: st.getAttribute("rotated") === "true" ? 90 : 0
        });
    }
}

function finalizarCargaGeneral(mode) {
    if(mode === 'SCAN' || mode === 'EDIT') dibujarContornos();
    actualizarDropdownFiltros(); actualizarDropdownPsych();
    if(mode !== 'PSYCH') renderTimelineSecuenciador();
    currentLoopFrameIdx = 0; updatePlayerInterval();
    if(spritesDetectados.length > 0) seleccionarFrameAfinador(0);
    document.getElementById('iaLoader').style.display = 'none';
    if(mode === 'EDIT') openWindow('win-orden');
    if(mode === 'PSYCH') openWindow('win-psych');
}

// ==========================================
// CÁMARA CSS Y HERRAMIENTAS MANUALES
// ==========================================
function setGlobalMode(mode) {
    globalMode = mode;
    document.getElementById('btnNavegar').classList.remove('active'); document.getElementById('btnEditar').classList.remove('active-edit');
    if(mode === 'VIEW') {
        document.getElementById('btnNavegar').classList.add('active');
        document.getElementById('manualToolsDiv').style.opacity = '0.3'; document.getElementById('manualToolsDiv').style.pointerEvents = 'none';
    } else {
        document.getElementById('btnEditar').classList.add('active-edit');
        document.getElementById('manualToolsDiv').style.opacity = '1'; document.getElementById('manualToolsDiv').style.pointerEvents = 'auto';
    }
}

document.getElementById('btnZoomIn').addEventListener('click', () => { 
    let oldZoom = zoomActual; zoomActual = Math.round((zoomActual + 0.1) * 10) / 10;
    if(zoomActual > 3.0) zoomActual = 3.0;
    let rect = scanWrapper.getBoundingClientRect(); let cx = rect.width / 2; let cy = rect.height / 2;
    panX = cx - (cx - panX) * (zoomActual / oldZoom); panY = cy - (cy - panY) * (zoomActual / oldZoom);
    actualizarCSSCamera(); 
});

document.getElementById('btnZoomOut').addEventListener('click', () => { 
    let oldZoom = zoomActual; zoomActual = Math.round((zoomActual - 0.1) * 10) / 10;
    if(zoomActual < 0.1) zoomActual = 0.1;
    let rect = scanWrapper.getBoundingClientRect(); let cx = rect.width / 2; let cy = rect.height / 2;
    panX = cx - (cx - panX) * (zoomActual / oldZoom); panY = cy - (cy - panY) * (zoomActual / oldZoom);
    actualizarCSSCamera(); 
});

function actualizarCSSCamera() {
    if(!imgOriginal.src) return;
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomActual})`;
    document.getElementById('txtZoom').textContent = `${Math.round(zoomActual * 100)}%`;
    dibujarContornos();
}

let activePointers = {}; let scanToolMode = 'SELECT'; 
let selScanIdx = -1; let isDragging = false; let dragAction = null; 

function setScanTool(tool) {
    scanToolMode = tool;
    document.getElementById('btnToolSelect').classList.remove('active'); document.getElementById('btnToolDraw').classList.remove('active'); document.getElementById('btnToolDelete').classList.remove('active');
    if(tool === 'SELECT') document.getElementById('btnToolSelect').classList.add('active');
    if(tool === 'DRAW') document.getElementById('btnToolDraw').classList.add('active');
    if(tool === 'DELETE') document.getElementById('btnToolDelete').classList.add('active');
    canvas.style.cursor = tool === 'DRAW' ? 'crosshair' : (tool === 'DELETE' ? 'not-allowed' : 'default');
    dibujarContornos();
}

function getRealCanvasPos(e) {
    let rect = scanWrapper.getBoundingClientRect();
    let xWrapper = e.clientX - rect.left; let yWrapper = e.clientY - rect.top;
    return { x: (xWrapper - panX) / zoomActual, y: (yWrapper - panY) / zoomActual };
}

function getHandleAt(p, box) {
    if(!box) return null; let hs = 30 / zoomActual; let h_half = hs / 2;
    let handles = [ {n:'tl', x: box.x, y: box.y}, {n:'tr', x: box.x+box.w, y: box.y}, {n:'bl', x: box.x, y: box.y+box.h}, {n:'br', x: box.x+box.w, y: box.y+box.h}, {n:'t', x: box.x+box.w/2, y: box.y}, {n:'b', x: box.x+box.w/2, y: box.y+box.h}, {n:'l', x: box.x, y: box.y+box.h/2}, {n:'r', x: box.x+box.w, y: box.y+box.h/2} ];
    for(let h of handles) { if(p.x >= h.x - h_half && p.x <= h.x + h_half && p.y >= h.y - h_half && p.y <= h.y + h_half) return h.n; } return null;
}

scanWrapper.addEventListener('pointerdown', (e) => {
    if(!imgOriginal.src) return;
    scanWrapper.setPointerCapture(e.pointerId); activePointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (globalMode === 'EDIT') {
        let p = getRealCanvasPos(e);
        if(scanToolMode === 'DELETE') {
            for(let i = spritesDetectados.length-1; i >= 0; i--) {
                let b = spritesDetectados[i];
                if(p.x >= b.x && p.x <= b.x+b.w && p.y >= b.y && p.y <= b.y+b.h) { spritesDetectados.splice(i, 1); selScanIdx = -1; autoRenumerar(); dibujarContornos(); return; }
            }
        } else if(scanToolMode === 'DRAW') {
            isDragging = true; spritesDetectados.push({ name: `custom_0000`, x: Math.round(p.x), y: Math.round(p.y), w: 150, h: 150, frameX: 0, frameY: 0, frameWidth: 150, frameHeight: 150, angle: 0 });
            selScanIdx = spritesDetectados.length - 1; dragAction = { type: 'DRAW', startX: p.x, startY: p.y }; autoRenumerar(); dibujarContornos();
        } else if(scanToolMode === 'SELECT') {
            if(selScanIdx !== -1) { let h = getHandleAt(p, spritesDetectados[selScanIdx]); if(h) { isDragging = true; let b = spritesDetectados[selScanIdx]; dragAction = { type: 'RESIZE', handle: h, startX: p.x, startY: p.y, origX: b.x, origY: b.y, origW: b.w, origH: b.h }; return; } }
            let found = -1;
            for(let i = spritesDetectados.length-1; i >= 0; i--) { let b = spritesDetectados[i]; if(p.x >= b.x && p.x <= b.x+b.w && p.y >= b.y && p.y <= b.y+b.h) { found = i; break; } }
            selScanIdx = found;
            if(found !== -1) { isDragging = true; let b = spritesDetectados[selScanIdx]; dragAction = { type: 'MOVE', startX: p.x, startY: p.y, origX: b.x, origY: b.y }; }
            dibujarContornos();
        }
    }
});

scanWrapper.addEventListener('pointermove', (e) => {
    if (!activePointers[e.pointerId]) return;
    if (globalMode === 'VIEW') {
        let keys = Object.keys(activePointers);
        if (keys.length === 1) {
            let dx = e.clientX - activePointers[e.pointerId].x; let dy = e.clientY - activePointers[e.pointerId].y;
            panX += dx; panY += dy; activePointers[e.pointerId] = { x: e.clientX, y: e.clientY }; actualizarCSSCamera();
        } else if (keys.length === 2) {
            let id1 = keys[0], id2 = keys[1]; let p1 = activePointers[id1], p2 = activePointers[id2];
            let movingId = e.pointerId; let otherId = (movingId == id1) ? id2 : id1; let pOther = activePointers[otherId];
            let oldDist = Math.hypot(p1.x - p2.x, p1.y - p2.y); let cx = (p1.x + p2.x) / 2; let cy = (p1.y + p2.y) / 2;
            activePointers[movingId] = { x: e.clientX, y: e.clientY };
            let newDist = Math.hypot(activePointers[movingId].x - pOther.x, activePointers[movingId].y - pOther.y);
            let oldZoom = zoomActual; let delta = (newDist - oldDist) * 0.005; zoomActual += delta;
            if(zoomActual < 0.1) zoomActual = 0.1; if(zoomActual > 3.0) zoomActual = 3.0;
            let rect = scanWrapper.getBoundingClientRect(); let pinchX = cx - rect.left; let pinchY = cy - rect.top;
            panX = pinchX - (pinchX - panX) * (zoomActual / oldZoom); panY = pinchY - (pinchY - panY) * (zoomActual / oldZoom);
            actualizarCSSCamera();
        }
    } else if (globalMode === 'EDIT' && isDragging && dragAction) {
        let p = getRealCanvasPos(e); let b = spritesDetectados[selScanIdx]; if(!b) return;
        if(dragAction.type === 'DRAW') {
            let newW = Math.round(p.x - dragAction.startX); let newH = Math.round(p.y - dragAction.startY);
            if(newW > 10) b.w = newW; if(newH > 10) b.h = newH; b.frameWidth = b.w; b.frameHeight = b.h;
        } else if (dragAction.type === 'MOVE') {
            b.x = Math.round(dragAction.origX + (p.x - dragAction.startX)); b.y = Math.round(dragAction.origY + (p.y - dragAction.startY));
        } else if (dragAction.type === 'RESIZE') {
            let dx = p.x - dragAction.startX; let dy = p.y - dragAction.startY;
            if(dragAction.handle.includes('r')) { b.w = Math.max(1, Math.round(dragAction.origW + dx)); }
            if(dragAction.handle.includes('b')) { b.h = Math.max(1, Math.round(dragAction.origH + dy)); }
            if(dragAction.handle.includes('l')) { b.x = Math.round(dragAction.origX + dx); b.w = Math.max(1, Math.round(dragAction.origW - dx)); }
            if(dragAction.handle.includes('t')) { b.y = Math.round(dragAction.origY + dy); b.h = Math.max(1, Math.round(dragAction.origH - dy)); }
            b.frameWidth = b.w; b.frameHeight = b.h;
        } dibujarContornos();
    }
});

function removePointer(e) { delete activePointers[e.pointerId]; if(isDragging) { isDragging = false; dragAction = null; actualizarDropdownFiltros(); actualizarDropdownPsych(); } }
scanWrapper.addEventListener('pointerup', removePointer); scanWrapper.addEventListener('pointercancel', removePointer);

function dibujarContornos() {
    if(!imgOriginal.src) return;
    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(imgOriginal, 0, 0); ctx.lineWidth = Math.max(1, 2 / zoomActual); 
        spritesDetectados.forEach((s, idx) => {
            let isSel = (idx === selScanIdx && globalMode === 'EDIT');
            ctx.strokeStyle = isSel ? 'var(--accent)' : (s.angle > 0 ? 'var(--accent-pink)' : 'rgba(0, 229, 255, 0.5)');
            if(isSel) ctx.setLineDash([4/zoomActual, 2/zoomActual]); else ctx.setLineDash([]);
            ctx.strokeRect(s.x, s.y, s.w, s.h);
            if(isSel && scanToolMode === 'SELECT') {
                ctx.fillStyle = "white"; ctx.setLineDash([]); let hs = 16 / zoomActual; let hh = hs/2;
                ctx.fillRect(s.x-hh, s.y-hh, hs, hs); ctx.fillRect(s.x+s.w-hh, s.y-hh, hs, hs); ctx.fillRect(s.x-hh, s.y+s.h-hh, hs, hs); ctx.fillRect(s.x+s.w-hh, s.y+s.h-hh, hs, hs);
                ctx.fillRect(s.x+s.w/2-hh, s.y-hh, hs, hs); ctx.fillRect(s.x+s.w/2-hh, s.y+s.h-hh, hs, hs); ctx.fillRect(s.x-hh, s.y+s.h/2-hh, hs, hs); ctx.fillRect(s.x+s.w-hh, s.y+s.h/2-hh, hs, hs);
            }
            ctx.fillStyle = isSel ? 'var(--accent)' : '#ffffff'; let fontSize = Math.max(12, 16/zoomActual);
            ctx.font = `bold ${fontSize}px monospace`; ctx.fillText(s.name, s.x + (4/zoomActual), s.y + fontSize);
        });
        ctx.setLineDash([]);
    } catch(e) { console.error("Error al dibujar:", e); }
}

// ==========================================
// ESCANEO AUTOMÁTICO (IA MODO BESTIA REAL)
// ==========================================
function clearAllScan() { spritesDetectados = []; selScanIdx = -1; dibujarContornos(); }

document.getElementById('btnProcesar').addEventListener('click', () => {
    // 1. Mostrar pantalla de carga
    showLoader("MODO ESCANEO", "Iniciando escaneo, espere..."); 
    
    // 2. Darle un respiro al navegador para pintar el modal antes de bloquear la CPU
    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.drawImage(imgOriginal, 0, 0);
        
        const w = canvas.width; 
        const h = canvas.height;
        const pixeles = ctx.getImageData(0, 0, w, h).data; 
        const visitados = new Uint8Array(w * h);
        
        let islasRaw = []; 
        let umbralAlpha = parseInt(document.getElementById('sliderCorte').value);
        let y = 0; // Iniciar desde la fila 0 de píxeles

        // 3. Procesamiento en Lotes (Chunks) para no congelar la página
        function procesarChunk() {
            // Escanearemos 40 filas por fotograma
            let limite = Math.min(y + 40, h); 
            
            for (; y < limite; y++) {
                for (let x = 0; x < w; x++) {
                    let idx = y * w + x;
                    
                    if (pixeles[idx * 4 + 3] >= umbralAlpha && !visitados[idx]) {
                        let minX = x, maxX = x, minY = y, maxY = y; 
                        let cola = [x, y]; 
                        visitados[idx] = 1; 
                        let head = 0;
                        let pixCount = 0; 
                        
                        while (head < cola.length) {
                            let cx = cola[head++]; 
                            let cy = cola[head++];
                            pixCount++;
                            
                            const vecinos = [[cx, cy+1], [cx+1, cy], [cx, cy-1], [cx-1, cy], [cx+1, cy+1], [cx-1, cy-1], [cx+1, cy-1], [cx-1, cy+1]];
                            for (const [nx, ny] of vecinos) {
                                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                    let nIdx = ny * w + nx;
                                    if (!visitados[nIdx] && pixeles[nIdx * 4 + 3] >= umbralAlpha) {
                                        visitados[nIdx] = 1; 
                                        cola.push(nx, ny);
                                        if (nx < minX) minX = nx; 
                                        if (nx > maxX) maxX = nx; 
                                        if (ny < minY) minY = ny; 
                                        if (ny > maxY) maxY = ny;
                                    }
                                }
                            }
                        }
                        
                        if (pixCount >= 4 && (maxX - minX) >= 2 && (maxY - minY) >= 2) {
                            islasRaw.push({ minX, maxX, minY, maxY });
                        }
                    }
                }
            }
            
            if (y < h) {
                let porcentaje = Math.floor((y / h) * 100);
                document.getElementById('iaStatusTxt').innerHTML = `
                    <div style="font-size:0.9rem; color:#aaa; margin-bottom:5px;">Analizando...</div>
                    <div style="font-size:2.5rem; font-weight:900; color:var(--accent); text-shadow: 0 0 10px rgba(0,229,255,0.5);">${porcentaje}%</div>
                    <div style="font-size:0.8rem; color:#ff4d88; margin-top:5px;">Esto puede tardar unos segundos.</div>
                `;
                requestAnimationFrame(procesarChunk);
            } else {
                document.getElementById('iaStatusTxt').innerHTML = `
                    <div style="font-size:1.2rem; font-weight:bold; color:var(--accent-gold);">¡Análisis 100% Completado!</div>
                    <div style="font-size:0.8rem; color:#aaa; margin-top:5px;">Procesando coordenadas finales...</div>
                `;
                setTimeout(faseFinal, 50);
            }
        }
        
        function faseFinal() {
            // 3.5. ¡ESCUDO ANTI-PARTÍCULAS INTERNAS! (Fusión de Contención)
            // Esto arregla el bug: Si hay una cajita chiquita que quedó atrapada adentro
            // de la caja principal del personaje, la destruye y la fusiona.
            let fusionInterna = true;
            while (fusionInterna) {
                fusionInterna = false;
                for (let i = 0; i < islasRaw.length; i++) {
                    for (let j = i + 1; j < islasRaw.length; j++) {
                        let A = islasRaw[i]; let B = islasRaw[j];
                        
                        // Le damos 2 píxeles de tolerancia por si la partícula asoma una esquinita
                        let tol = 2; 
                        
                        let aContieneB = (B.minX >= A.minX - tol && B.maxX <= A.maxX + tol && B.minY >= A.minY - tol && B.maxY <= A.maxY + tol);
                        let bContieneA = (A.minX >= B.minX - tol && A.maxX <= B.maxX + tol && A.minY >= B.minY - tol && A.maxY <= B.maxY + tol);

                        if (aContieneB || bContieneA) {
                            // Fusionamos la caja grande con la cajita pequeña
                            islasRaw[i] = {
                                minX: Math.min(A.minX, B.minX), maxX: Math.max(A.maxX, B.maxX),
                                minY: Math.min(A.minY, B.minY), maxY: Math.max(A.maxY, B.maxY)
                            };
                            islasRaw.splice(j, 1); // Eliminamos la caja basura
                            fusionInterna = true;
                            break;
                        }
                    }
                    if (fusionInterna) break;
                }
            }

            // 4. Aplicar Fusión de Magnetismo (Sólo si el slider es mayor a 0)
            let dist = parseInt(document.getElementById('sliderUnion').value); 
            if (dist > 0) {
                let fusion = true;
                while (fusion) {
                    fusion = false;
                    for (let i = 0; i < islasRaw.length; i++) {
                        for (let j = i + 1; j < islasRaw.length; j++) {
                            let A = islasRaw[i]; let B = islasRaw[j];
                            let dx = Math.max(0, A.minX - B.maxX, B.minX - A.maxX); 
                            let dy = Math.max(0, A.minY - B.maxY, B.minY - A.maxY);
                            if (Math.max(dx, dy) <= dist) {
                                islasRaw[i] = { 
                                    minX: Math.min(A.minX, B.minX), maxX: Math.max(A.maxX, B.maxX), 
                                    minY: Math.min(A.minY, B.minY), maxY: Math.max(A.maxY, B.maxY) 
                                };
                                islasRaw.splice(j, 1); fusion = true; break;
                            }
                        } 
                        if (fusion) break;
                    }
                }
            }

            // 5. Convertir a Cajas Finales (Con 1 pixel de padding seguro)
            spritesDetectados = islasRaw.map((isla) => {
                let finalMinX = Math.max(0, isla.minX - 1);
                let finalMaxX = Math.min(w - 1, isla.maxX + 1);
                let finalMinY = Math.max(0, isla.minY - 1);
                let finalMaxY = Math.min(h - 1, isla.maxY + 1);
                
                let fw = finalMaxX - finalMinX + 1; 
                let fh = finalMaxY - finalMinY + 1;
                return { name: `frame_0000`, x: finalMinX, y: finalMinY, w: fw, h: fh, frameX: 0, frameY: 0, frameWidth: fw, frameHeight: fh, angle: 0 };
            });
            
            spritesDetectados.sort((a, b) => (a.y - b.y) || (a.x - b.x));
            selScanIdx = -1;
            autoRenumerar(); 
            finalizarCargaGeneral('SCAN');
        }
        
        // Arrancar el motor de escaneo
        requestAnimationFrame(procesarChunk);
        
    }, 150); 
});

function autoFitSelected() {
    if (selScanIdx === -1 || !imgOriginal.src) { alert("❌ Primero usa el botón Seleccionar y toca un cuadro."); return; }
    let b = spritesDetectados[selScanIdx]; let umbralAlpha = parseInt(document.getElementById('sliderCorte').value);
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(imgOriginal, 0, 0);
    const w = canvas.width; const h = canvas.height; const imgData = ctx.getImageData(0, 0, w, h).data;
    let minX = b.x + b.w, maxX = b.x, minY = b.y + b.h, maxY = b.y; let found = false;
    let startX = Math.max(0, b.x - 2); let endX = Math.min(w, b.x + b.w + 2);
    let startY = Math.max(0, b.y - 2); let endY = Math.min(h, b.y + b.h + 2);
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            let alpha = imgData[(y * w + x) * 4 + 3];
            if (alpha >= umbralAlpha) {
                if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; found = true;
            }
        }
    }
    if (found) { b.x = minX; b.y = minY; b.w = maxX - minX + 1; b.h = maxY - minY + 1; b.frameWidth = b.w; b.frameHeight = b.h; dibujarContornos(); } 
    else { alert("❌ No se encontró ningun dibujo dentro"); dibujarContornos(); }
}

// ==========================================
// SECUENCIADOR Y AFINADOR
// ==========================================
function renderTimelineSecuenciador() {
    timelineContainer.innerHTML = '';
    spritesDetectados.forEach((s, gIdx) => {
        let item = document.createElement('div'); item.className = `timeline-item ${gIdx === indexEditando ? 'active' : ''}`;
        
        let meta = document.createElement('div'); meta.className = 'timeline-item-meta';
        let chk = document.createElement('input'); chk.type = 'checkbox'; chk.className = 'frame-checkbox'; chk.setAttribute('data-index', gIdx); chk.onclick = (e) => e.stopPropagation();
        
        let thumb = document.createElement('canvas'); thumb.width = s.w; thumb.height = s.h;
        let tCtx = thumb.getContext('2d'); tCtx.drawImage(imgOriginal, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h);
        let nameSpan = document.createElement('span'); nameSpan.className = 'timeline-item-name'; nameSpan.textContent = s.name;
        meta.appendChild(chk); meta.appendChild(thumb); meta.appendChild(nameSpan);

        let actions = document.createElement('div'); actions.className = 'timeline-actions';
        
        let btnUp = document.createElement('button'); btnUp.className = 'btn-nav'; btnUp.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/128/992/992703.png" class="icon-sm" alt="Arriba">'; btnUp.onclick = (e) => { e.stopPropagation(); moverFrame(gIdx, -1); };
        let btnDown = document.createElement('button'); btnDown.className = 'btn-nav'; btnDown.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/128/3519/3519316.png" class="icon-sm" alt="Abajo">'; btnDown.onclick = (e) => { e.stopPropagation(); moverFrame(gIdx, 1); };
        let btnDup = document.createElement('button'); btnDup.className = 'btn-dup'; btnDup.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/1621/1621635.png" class="icon-sm" alt="Duplicar">'; btnDup.title = "Duplicar Frame"; btnDup.onclick = (e) => { e.stopPropagation(); duplicateFrame(gIdx); };
        let btnDel = document.createElement('button'); btnDel.className = 'btn-del'; btnDel.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/484/484611.png" class="icon-sm" alt="Eliminar">'; btnDel.title = "Eliminar Frame"; btnDel.onclick = (e) => { e.stopPropagation(); deleteFrame(gIdx); };

        if (gIdx === 0) btnUp.disabled = true; if (gIdx === spritesDetectados.length - 1) btnDown.disabled = true;
        actions.appendChild(btnUp); actions.appendChild(btnDown); actions.appendChild(btnDup); actions.appendChild(btnDel);
        item.appendChild(meta); item.appendChild(actions);

        item.addEventListener('click', () => { seleccionarFrameAfinador(gIdx); openWindow('win-afinador'); });
        timelineContainer.appendChild(item);
    });
}

function moverFrame(idx, dir) {
    let dest = idx + dir; if (dest < 0 || dest >= spritesDetectados.length) return;
    let temp = spritesDetectados[idx]; spritesDetectados[idx] = spritesDetectados[dest]; spritesDetectados[dest] = temp;
    if (indexEditando === idx) indexEditando = dest; else if (indexEditando === dest) indexEditando = idx;
    autoRenumerar(); renderTimelineSecuenciador(); dibujarContornos(); actualizarDropdownFiltros(); actualizarDropdownPsych();
}
function deleteFrame(idx) {
    spritesDetectados.splice(idx, 1); if(indexEditando === idx) indexEditando = null;
    autoRenumerar(); renderTimelineSecuenciador(); dibujarContornos(); actualizarDropdownFiltros(); actualizarDropdownPsych();
}

document.getElementById('btnAplicarBatch').addEventListener('click', () => {
    let prefijo = document.getElementById('inputBatchName').value.trim();
    if (!prefijo) return alert("❌ Escribe un prefijo.");
    let casillas = document.querySelectorAll('.frame-checkbox:checked');
    if (casillas.length === 0) return alert("❌ Marca almenos un sprite.");
    casillas.forEach((cb) => { let indice = parseInt(cb.getAttribute('data-index')); spritesDetectados[indice].name = prefijo + "0000"; });
    autoRenumerar(); actualizarDropdownFiltros(); actualizarDropdownPsych(); renderTimelineSecuenciador(); document.getElementById('inputBatchName').value = '';
});

document.getElementById('btnSelectAll').addEventListener('click', () => {
    let chks = document.querySelectorAll('.frame-checkbox'); let anyUnchecked = Array.from(chks).some(c => !c.checked);
    chks.forEach(cb => cb.checked = anyUnchecked);
});

function actualizarDropdownFiltros() {
    let current = selectAnimFilter.value; selectAnimFilter.innerHTML = '<option value="ALL">-- Reproduciendo Todo --</option>';
    let prefijos = new Set(); spritesDetectados.forEach(s => { let base = s.name.replace(/\d+$/, ''); if(base) prefijos.add(base); });
    prefijos.forEach(p => { let opt = document.createElement('option'); opt.value = p; opt.textContent = p; selectAnimFilter.appendChild(opt); });
    if([...prefijos].includes(current)) selectAnimFilter.value = current;
}

function seleccionarFrameAfinador(index) {
    if(spritesDetectados.length === 0) return; indexEditando = index; let s = spritesDetectados[index];
    document.getElementById('lblCurrentFrame').innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/433/433096.png" class="icon" alt="Sel"> ${s.name}`;
    ['frameX','frameY','frameWidth','frameHeight','w','h'].forEach(p => document.getElementById(`inp_${p}`).value = s[p]);
    document.getElementById('btnToggleRotar').innerHTML = `<img src="https://cdn-icons-png.flaticon.com/128/45/45647.png" class="icon" alt="Rot"> Rotar (${s.angle || 0}°)`;
    document.getElementById('btnToggleRotar').style.color = (s.angle > 0) ? 'var(--accent-pink)' : 'white';
    renderizarPreviewTiempoReal();
}
function prevFrame() { if(spritesDetectados.length===0) return; seleccionarFrameAfinador((indexEditando===null||indexEditando===0) ? spritesDetectados.length-1 : indexEditando-1); }
function nextFrame() { if(spritesDetectados.length===0) return; seleccionarFrameAfinador((indexEditando===null||indexEditando===spritesDetectados.length-1) ? 0 : indexEditando+1); }

function renderizarPreviewTiempoReal() {
    if (indexEditando === null || spritesDetectados.length === 0) return;
    let s = spritesDetectados[indexEditando]; let fw = s.frameWidth || s.w; let fh = s.frameHeight || s.h;
    canvasPreview.width = Math.max(fw, fh) + 40; canvasPreview.height = Math.max(fw, fh) + 40;
    ctxPreview.clearRect(0,0,canvasPreview.width,canvasPreview.height); ctxPreview.fillStyle = "#04040a"; ctxPreview.fillRect(0,0,canvasPreview.width,canvasPreview.height);
    ctxPreview.save(); ctxPreview.translate(canvasPreview.width/2 - fw/2, canvasPreview.height/2 - fh/2);
    ctxPreview.strokeStyle = "rgba(255, 255, 255, 0.3)"; ctxPreview.strokeRect(0, 0, fw, fh);
    ctxPreview.strokeStyle = "rgba(0, 229, 255, 0.2)"; ctxPreview.beginPath(); ctxPreview.moveTo(fw/2, 0); ctxPreview.lineTo(fw/2, fh); ctxPreview.moveTo(0, fh/2); ctxPreview.lineTo(fw, fh/2); ctxPreview.stroke();
    let drawX = -s.frameX; let drawY = -s.frameY;
    ctxPreview.translate(drawX + s.w/2, drawY + s.h/2); ctxPreview.rotate((s.angle || 0) * Math.PI / 180);
    ctxPreview.drawImage(imgOriginal, s.x, s.y, s.w, s.h, -s.w/2, -s.h/2, s.w, s.h);
    ctxPreview.restore();
}

function changeProp(p, v) { if(indexEditando===null) return; spritesDetectados[indexEditando][p] = parseInt(v)||0; renderizarPreviewTiempoReal(); dibujarContornos(); }
function incProp(p, amt) { if(indexEditando===null) return; spritesDetectados[indexEditando][p] = (parseInt(spritesDetectados[indexEditando][p])||0)+amt; document.getElementById(`inp_${p}`).value = spritesDetectados[indexEditando][p]; renderizarPreviewTiempoReal(); dibujarContornos(); }

document.getElementById('btnToggleRotar').addEventListener('click', () => { 
    if(indexEditando === null) return; let s = spritesDetectados[indexEditando]; s.angle = ((s.angle || 0) + 90) % 360; seleccionarFrameAfinador(indexEditando); dibujarContornos(); 
});

selectAnimFilter.addEventListener('change', () => { currentLoopFrameIdx = 0; updatePlayerInterval(); });

function updatePlayerInterval() {
    clearInterval(playInterval); if (!playActive || spritesDetectados.length === 0) return;
    canvasLoopPlayer.width = 400; canvasLoopPlayer.height = 400;
    playInterval = setInterval(() => {
        let filtro = selectAnimFilter.value;
        let framesLoop = spritesDetectados.filter(s => filtro === 'ALL' ? true : s.name.replace(/\d+$/, '') === filtro);
        if (framesLoop.length === 0) { ctxLoopPlayer.clearRect(0,0,400,400); return; }
        if (currentLoopFrameIdx >= framesLoop.length) currentLoopFrameIdx = 0;
        let s = framesLoop[currentLoopFrameIdx];
        ctxLoopPlayer.clearRect(0, 0, 400,400); ctxLoopPlayer.fillStyle = "#04040a"; ctxLoopPlayer.fillRect(0, 0, 400,400);
        ctxLoopPlayer.save(); ctxLoopPlayer.translate(200, 200); 
        let maxDim = Math.max(s.w, s.h, s.frameWidth || 0, s.frameHeight || 0); if (maxDim > 300) { let scale = 300 / maxDim; ctxLoopPlayer.scale(scale, scale); }
        let drawX = -s.frameX - (s.frameWidth || s.w) / 2; let drawY = -s.frameY - (s.frameHeight || s.h) / 2;
        ctxLoopPlayer.translate(drawX + s.w/2, drawY + s.h/2); ctxLoopPlayer.rotate((s.angle || 0) * Math.PI / 180);
        ctxLoopPlayer.drawImage(imgOriginal, s.x, s.y, s.w, s.h, -s.w/2, -s.h/2, s.w, s.h);
        ctxLoopPlayer.restore(); currentLoopFrameIdx++;
    }, 1000 / fpsActual);
}

document.getElementById('btnPlayPause').addEventListener('click', () => { 
    playActive = !playActive; let icono = playActive ? '1214/1214674.png' : '724/724963.png'; 
    document.getElementById('btnPlayPause').innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/${icono}" class="icon" alt="PlayPause"> ` + (playActive ? "PAUSAR" : "REANUDAR"); updatePlayerInterval(); 
});

document.getElementById('btnFpsUp').addEventListener('click', () => { if (fpsActual < 60) { fpsActual++; document.getElementById('txtFpsDisplay').textContent = `${fpsActual} FPS`; updatePlayerInterval(); } });
document.getElementById('btnFpsDown').addEventListener('click', () => { if (fpsActual > 1) { fpsActual--; document.getElementById('txtFpsDisplay').textContent = `${fpsActual} FPS`; updatePlayerInterval(); } });

// ==========================================
// EXPORTACIÓN DUAL CON FIRMA XML
// ==========================================
async function repackAndExport() {
    if(spritesDetectados.length === 0) return alert("No hay frames para guardar.");
    showLoader("OPTIMIZADOR", "Eliminando sprites duplicados..."); await pensar(500);

    let uniqueFrames = []; let duplicatesMap = new Map(); let hashMap = new Map();
    for(let s of spritesDetectados) {
        let tmpCanvas = document.createElement('canvas'); tmpCanvas.width = s.w; tmpCanvas.height = s.h;
        let tmpCtx = tmpCanvas.getContext('2d'); tmpCtx.drawImage(imgOriginal, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h);
        let hash = tmpCanvas.toDataURL(); 
        if(hashMap.has(hash)) { let master = hashMap.get(hash); duplicatesMap.set(s.name, master); } 
        else { hashMap.set(hash, s); uniqueFrames.push(s); }
    }
    
    let dupCount = spritesDetectados.length - uniqueFrames.length;
    uniqueFrames.sort((a, b) => b.h - a.h);
    let totalArea = 0; let maxW = 0;
    for(let s of uniqueFrames) { totalArea += (s.w * s.h); if(s.w > maxW) maxW = s.w; }
    let idealWidth = Math.ceil(Math.sqrt(totalArea) * 1.15); let maxWidth = Math.max(maxW, idealWidth); 
    let currentX = 0; let currentY = 0; let shelfHeight = 0; let actualMaxWidth = 0;
    for(let s of uniqueFrames) {
        if(currentX + s.w > maxWidth) { currentX = 0; currentY += shelfHeight; shelfHeight = 0; }
        s.packX = currentX; s.packY = currentY; currentX += s.w;
        if(s.h > shelfHeight) shelfHeight = s.h; if(currentX > actualMaxWidth) actualMaxWidth = currentX;
    }
    let totalHeight = currentY + shelfHeight;
    let packCanvas = document.createElement('canvas'); packCanvas.width = actualMaxWidth; packCanvas.height = totalHeight;
    let pCtx = packCanvas.getContext('2d');
    for(let s of uniqueFrames) { pCtx.drawImage(imgOriginal, s.x, s.y, s.w, s.h, s.packX, s.packY, s.w, s.h); }
    packCanvas.toBlob(function(blob) { let url = URL.createObjectURL(blob); let a = document.createElement('a'); a.href = url; a.download = nombreArchivo.replace(/\.[^/.]+$/, "_optimized.png"); a.click(); });

    let xml = `<?xml version="1.0" encoding="utf-8"?>\n<TextureAtlas imagePath="${nombreArchivo.replace(/\.[^/.]+$/, "_optimized.png")}">\n`;
    xml += `\t\n`;
    xml += `\t\n`;
    
    let exportSprites = [...spritesDetectados]; exportSprites.sort((a, b) => a.name.localeCompare(b.name));
    exportSprites.forEach((s) => {
        let target = duplicatesMap.has(s.name) ? duplicatesMap.get(s.name) : s;
        let rot = (s.angle === 90 || s.angle === 270) ? ' rotated="true"' : '';
        xml += `\t<SubTexture name="${s.name}" x="${target.packX}" y="${target.packY}" width="${target.w}" height="${target.h}" frameX="${s.frameX}" frameY="${s.frameY}" frameWidth="${s.frameWidth}" frameHeight="${s.frameHeight}"${rot}/>\n`;
    });
    xml += `</TextureAtlas>`;
    
    let bXml = new Blob([xml], { type: 'text/xml' }); let urlXml = URL.createObjectURL(bXml);
    let aXml = document.createElement('a'); aXml.href = urlXml; aXml.download = nombreArchivo.replace(/\.[^/.]+$/, "_optimized.xml"); aXml.click();
    iaLoader.style.display = 'none';
    if(dupCount > 0) alert(`¡Éxito! Imagen comprimida.\nSe eliminaron ${dupCount} frames idénticos.`); else alert(`¡Éxito! Imagen comprimida.`);
}

function exportarActual() {
    if(appMode === 'PSYCH') {
        let charData = { animations: psychAnimations, no_antialiasing: !document.getElementById('p_antialias').checked, image: document.getElementById('p_image').value, position: [parseInt(document.getElementById('p_posX').value)||0, parseInt(document.getElementById('p_posY').value)||0], healthicon: document.getElementById('p_icon').value, flip_x: document.getElementById('p_flip').checked, healthbar_colors: hexToRgb(document.getElementById('p_color').value), camera_position: [parseInt(document.getElementById('p_camX').value)||0, parseInt(document.getElementById('p_camY').value)||0], sing_duration: parseFloat(document.getElementById('p_sing').value)||4, scale: parseFloat(document.getElementById('p_scale').value)||1 };
        const blob = new Blob([JSON.stringify(charData, null, "\t")], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = nombreArchivo.replace(/\.[^/.]+$/, ".json"); document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } else {
        if (spritesDetectados.length === 0) return alert("❌ No hay frames para exportar.");
        
        let xml = `<?xml version="1.0" encoding="utf-8"?>\n<TextureAtlas imagePath="${nombreArchivo}">\n`;
        xml += `\t\n`;
        xml += `\t\n`;
        
        let exportSprites = [...spritesDetectados]; exportSprites.sort((a, b) => a.name.localeCompare(b.name));
        exportSprites.forEach((s) => {
            let rot = (s.angle === 90 || s.angle === 270) ? ' rotated="true"' : '';
            xml += `\t<SubTexture name="${s.name}" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" frameX="${s.frameX}" frameY="${s.frameY}" frameWidth="${s.frameWidth}" frameHeight="${s.frameHeight}"${rot}/>\n`;
        });
        xml += `</TextureAtlas>`;
        
        const blob = new Blob([xml], { type: 'text/xml' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        let baseName = nombreArchivo.replace(/\.[^/.]+$/, ""); a.download = baseName + ".xml"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
}

// ==========================================
// PSYCH ENGINE
// ==========================================
function actualizarDropdownPsych() {
    p_animPrefix.innerHTML = ''; let prefijos = new Set(); spritesDetectados.forEach(s => { let base = s.name.replace(/\d+$/, ''); if(base) prefijos.add(base); });
    prefijos.forEach(p => { let opt = document.createElement('option'); opt.value = p; opt.textContent = p; p_animPrefix.appendChild(opt); });
}

function addPsychAnimation() {
    let name = document.getElementById('p_animName').value.trim(); let prefix = p_animPrefix.value;
    if(!name || !prefix) return alert("❌ Debes darle nombre y elegir un prefix.");
    psychAnimations.push({ anim: name, name: prefix, loop: false, fps: 24, offsets: [0, 0], indices: [] }); document.getElementById('p_animName').value = ''; renderPsychAnimList();
    if(psychLiveActiveAnimIdx === -1) playPsychAnim(psychAnimations.length-1);
}

function renderPsychAnimList() {
    psychAnimList.innerHTML = '';
    psychAnimations.forEach((a, i) => {
        let card = document.createElement('div'); card.className = `anim-card ${i===psychLiveActiveAnimIdx ? 'active-anim':''}`;
        card.innerHTML = `
            <div class="anim-card-header">
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="btn-play-anim" onclick="playPsychAnim(${i})"><img src="https://cdn-icons-png.flaticon.com/512/724/724963.png" class="icon-sm" style="filter: brightness(0) !important;" alt="Play"></button>
                    <span>${a.anim} <small style="color:#aaa;">(${a.name})</small></span>
                </div>
                <button class="btn-del" style="padding:2px 6px; font-size:0.7rem;" onclick="deletePsychAnim(${i})"><img src="https://cdn-icons-png.flaticon.com/512/2734/2734822.png" class="icon-sm" alt="Del"></button>
            </div>
            <div class="anim-card-body">
                <div>
                    <label style="color:#aaa; font-size:0.7rem;">Offset X</label>
                    <div class="tuner-actions" style="margin-top:2px;">
                        <button class="btn-inc" style="width:20px;height:20px;font-size:0.8rem;" onclick="incPAnim(${i}, 'offX', -1)">-</button>
                        <input type="number" id="p_offX_${i}" value="${a.offsets[0]}" onchange="updatePAnim(${i}, 'offX', this.value)" style="font-size:0.75rem; padding:2px;">
                        <button class="btn-inc" style="width:20px;height:20px;font-size:0.8rem;" onclick="incPAnim(${i}, 'offX', 1)">+</button>
                    </div>
                </div>
                <div>
                    <label style="color:#aaa; font-size:0.7rem;">Offset Y</label>
                    <div class="tuner-actions" style="margin-top:2px;">
                        <button class="btn-inc" style="width:20px;height:20px;font-size:0.8rem;" onclick="incPAnim(${i}, 'offY', -1)">-</button>
                        <input type="number" id="p_offY_${i}" value="${a.offsets[1]}" onchange="updatePAnim(${i}, 'offY', this.value)" style="font-size:0.75rem; padding:2px;">
                        <button class="btn-inc" style="width:20px;height:20px;font-size:0.8rem;" onclick="incPAnim(${i}, 'offY', 1)">+</button>
                    </div>
                </div>
                <div>
                    <label style="color:#aaa; font-size:0.7rem;">FPS</label>
                    <div class="tuner-actions" style="margin-top:2px;">
                        <button class="btn-inc" style="width:20px;height:20px;font-size:0.8rem;" onclick="incPAnim(${i}, 'fps', -1)">-</button>
                        <input type="number" id="p_fps_${i}" value="${a.fps}" onchange="updatePAnim(${i}, 'fps', this.value)" style="font-size:0.75rem; padding:2px;">
                        <button class="btn-inc" style="width:20px;height:20px;font-size:0.8rem;" onclick="incPAnim(${i}, 'fps', 1)">+</button>
                    </div>
                </div>
                <div style="display:flex; align-items:flex-end; padding-bottom:4px;">
                    <label style="color:#aaa; font-size:0.75rem; display:flex; align-items:center; gap:4px; cursor:pointer;">
                        <input type="checkbox" style="scale:1.2; accent-color:var(--accent-psych);" ${a.loop?'checked':''} onchange="updatePAnim(${i}, 'loop', this.checked)"> Loop
                    </label>
                </div>
                <div style="grid-column: span 2;">
                    <label style="color:#aaa; font-size:0.7rem;">Indices (ej: 0,1,2,3 - vacío = todos)</label>
                    <input type="text" style="width:100%; background:#000; border:1px solid #333; color:white; padding:4px; border-radius:4px; font-size:0.75rem; text-align:center; margin-top:2px;" placeholder="Ej: 0, 1, 2" value="${a.indices.join(',')}" onchange="updatePAnim(${i}, 'indices', this.value)">
                </div>
            </div>
        `; psychAnimList.appendChild(card);
    });
}

function incPAnim(idx, prop, amt) {
    let val = 0;
    if(prop === 'offX') { psychAnimations[idx].offsets[0] += amt; val = psychAnimations[idx].offsets[0]; document.getElementById(`p_offX_${idx}`).value = val; }
    if(prop === 'offY') { psychAnimations[idx].offsets[1] += amt; val = psychAnimations[idx].offsets[1]; document.getElementById(`p_offY_${idx}`).value = val; }
    if(prop === 'fps')  { psychAnimations[idx].fps += amt; val = psychAnimations[idx].fps; document.getElementById(`p_fps_${idx}`).value = val; }
    if(idx === psychLiveActiveAnimIdx) startPsychLiveLoop();
}

function updatePAnim(idx, prop, val) {
    if(prop==='offX') psychAnimations[idx].offsets[0] = parseInt(val)||0;
    if(prop==='offY') psychAnimations[idx].offsets[1] = parseInt(val)||0;
    if(prop==='fps') psychAnimations[idx].fps = parseInt(val)||24;
    if(prop==='loop') psychAnimations[idx].loop = val;
    if(prop==='indices') { psychAnimations[idx].indices = val.trim() ? val.split(',').map(n=>parseInt(n.trim())).filter(n=>!isNaN(n)) : []; }
    if(idx === psychLiveActiveAnimIdx) startPsychLiveLoop();
}
function deletePsychAnim(idx) { psychAnimations.splice(idx, 1); if(psychLiveActiveAnimIdx===idx) psychLiveActiveAnimIdx=-1; renderPsychAnimList(); }
function playPsychAnim(idx) { psychLiveActiveAnimIdx = idx; psychLiveFrameIdx = 0; renderPsychAnimList(); startPsychLiveLoop(); }
function updatePsychLive() { if(psychLiveActiveAnimIdx !== -1) startPsychLiveLoop(); }

function startPsychLiveLoop() {
    clearInterval(psychLiveInterval); if(psychLiveActiveAnimIdx === -1 || spritesDetectados.length === 0) return;
    let anim = psychAnimations[psychLiveActiveAnimIdx];
    let frames = spritesDetectados.filter(s => s.name.replace(/\d+$/, '') === anim.name);
    if(anim.indices && anim.indices.length > 0) { frames = anim.indices.map(i => frames[i]).filter(f => f); }
    if(frames.length === 0) { ctxPsychLive.clearRect(0,0,canvasPsychLive.width, canvasPsychLive.height); return; }

    canvasPsychLive.width = 600; canvasPsychLive.height = 600;

    psychLiveInterval = setInterval(() => {
        if(psychLiveFrameIdx >= frames.length) { if(anim.loop) psychLiveFrameIdx = 0; else psychLiveFrameIdx = frames.length - 1; }
        let s = frames[psychLiveFrameIdx]; ctxPsychLive.clearRect(0, 0, 600, 600);
        let scale = parseFloat(document.getElementById('p_scale').value) || 1; let flipX = document.getElementById('p_flip').checked; let antialias = document.getElementById('p_antialias').checked;
        ctxPsychLive.imageSmoothingEnabled = antialias; ctxPsychLive.save(); ctxPsychLive.translate(300, 300); ctxPsychLive.scale(flipX ? -scale : scale, scale); ctxPsychLive.translate(anim.offsets[0], anim.offsets[1]);
        let drawX = -s.frameX - (s.frameWidth || s.w) / 2; let drawY = -s.frameY - (s.frameHeight || s.h) / 2;
        ctxPsychLive.translate(drawX + s.w/2, drawY + s.h/2); ctxPsychLive.rotate((s.angle || 0) * Math.PI / 180); ctxPsychLive.drawImage(imgOriginal, s.x, s.y, s.w, s.h, -s.w/2, -s.h/2, s.w, s.h);
        ctxPsychLive.restore(); if(anim.loop || psychLiveFrameIdx < frames.length - 1) psychLiveFrameIdx++;
    }, 1000 / (anim.fps || 24));
}

function hexToRgb(hex) { let res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return res ? [parseInt(res[1], 16), parseInt(res[2], 16), parseInt(res[3], 16)] : [0,0,0]; }
