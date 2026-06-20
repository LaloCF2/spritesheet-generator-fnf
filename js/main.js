// ==========================================
// 1. main.js - NÚCLEO GLOBAL, VARIABLES Y FUNCIONES
// ==========================================
const CURRENT_VERSION = '1.1'; // ¡Sube este número para mostrar el Changelog!

window.onload = () => {
    // 1. Inicializar el Tema Visual
    const savedTheme = localStorage.getItem('iasprite_theme') || 'cyberpunk';
    let switcher = document.getElementById('themeSwitcher');
    if(switcher) switcher.value = savedTheme;
    changeTheme(savedTheme);

    // 2. Comprobar Versión para Mostrar Modales (Bienvenida y Novedades)
    const lastVersion = localStorage.getItem('iasprite_version');
    
    if (!lastVersion) {
        // Usuario totalmente nuevo
        let modWelcome = document.getElementById('welcomeModal');
        if (modWelcome) modWelcome.style.display = 'flex';
    } else if (lastVersion !== CURRENT_VERSION) {
        // Usuario antiguo, pero se detecta una nueva versión
        let modChangelog = document.getElementById('changelogModal');
        if (modChangelog) modChangelog.style.display = 'flex';
    }
};

// Funciones para cerrar los modales y guardar la nueva versión
window.closeWelcomeModal = function() {
    document.getElementById('welcomeModal').style.display = 'none';
    localStorage.setItem('iasprite_version', CURRENT_VERSION);
};

window.closeChangelogModal = function() {
    document.getElementById('changelogModal').style.display = 'none';
    localStorage.setItem('iasprite_version', CURRENT_VERSION);
};

function changeTheme(theme) {
    document.body.classList.remove('theme-psych', 'theme-bf');
    if(theme !== 'cyberpunk') document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('iasprite_theme', theme);
}

// VARIABLES GLOBALES (Compartidas)
let appMode = 'HOME'; let imgOriginal = new Image(); let nombreArchivo = "spritesheet.png";
let spritesDetectados = []; let psychAnimations = []; let indexEditando = null;

// MOTOR DE VISTA CSS
let zoomActual = 1.0; let panX = 0, panY = 0; let globalMode = 'VIEW'; 

// DOM GLOBALES
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
document.getElementById('sliderPad').addEventListener('input', (e) => document.getElementById('valPad').textContent = e.target.value);

// RENOMBRADOR AUTOMÁTICO
window.autoRenumerar = function() {
    let contadores = {};
    spritesDetectados.forEach(s => {
        let prefijo = s.name.replace(/\d+$/, '');
        if (!prefijo) prefijo = "frame_"; 
        if (contadores[prefijo] === undefined) contadores[prefijo] = 0;
        s.name = prefijo + String(contadores[prefijo]).padStart(4, '0'); 
        contadores[prefijo]++;
    });
};

window.duplicateFrame = function(idx) {
    let original = spritesDetectados[idx]; let copy = JSON.parse(JSON.stringify(original)); 
    spritesDetectados.splice(idx + 1, 0, copy); 
    if (indexEditando !== null && indexEditando > idx) { indexEditando++; }
    autoRenumerar(); 
    if (typeof renderTimelineSecuenciador === 'function') renderTimelineSecuenciador(); 
    if (typeof dibujarContornos === 'function') dibujarContornos(); 
    if (typeof actualizarDropdownFiltros === 'function') actualizarDropdownFiltros(); 
    if (typeof actualizarDropdownPsych === 'function') actualizarDropdownPsych();
};

window.duplicarActualAfinador = function() { 
    if(indexEditando === null) return; 
    duplicateFrame(indexEditando); 
    if (typeof seleccionarFrameAfinador === 'function') seleccionarFrameAfinador(indexEditando + 1); 
};

function openWindow(winId) {
    document.querySelectorAll('.window-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.win-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(winId).classList.add('active');
    
    if(winId==='win-home') document.getElementById('navHome').classList.add('active');
    if(winId==='win-escaner') document.getElementById('navEscaner').classList.add('active');
    if(winId==='win-orden') document.getElementById('navOrden').classList.add('active');
    if(winId==='win-afinador') document.getElementById('navAfinador').classList.add('active');
    if(winId==='win-psych') document.getElementById('navPsych').classList.add('active');
    if(winId==='win-compresor') document.getElementById('navCompresor').classList.add('active');

    if(winId === 'win-afinador' && typeof renderizarPreviewTiempoReal === 'function') { renderizarPreviewTiempoReal(); updatePlayerInterval(); }
    if(winId === 'win-orden' && typeof renderTimelineSecuenciador === 'function') { renderTimelineSecuenciador(); }
    if(winId === 'win-psych' && typeof startPsychLiveLoop === 'function') { startPsychLiveLoop(); }
    if(winId === 'win-escaner' && typeof actualizarCSSCamera === 'function') { actualizarCSSCamera(); dibujarContornos(); }
}

function toggleNavButtons() {
    document.getElementById('navEscaner').style.display = (appMode === 'SCAN') ? 'flex' : 'none';
    document.getElementById('navOrden').style.display = (appMode === 'SCAN' || appMode === 'EDIT') ? 'flex' : 'none';
    document.getElementById('navAfinador').style.display = (appMode === 'SCAN' || appMode === 'EDIT') ? 'flex' : 'none';
    document.getElementById('navPsych').style.display = (appMode === 'PSYCH') ? 'flex' : 'none';
    document.getElementById('navCompresor').style.display = (appMode === 'COMPRESS') ? 'flex' : 'none';
    
    document.getElementById('navPack').style.display = (appMode === 'EDIT' || appMode === 'SCAN') ? 'flex' : 'none';
    document.getElementById('navExport').style.display = (appMode !== 'HOME' && appMode !== 'COMPRESS') ? 'flex' : 'none';
    
    if(appMode === 'PSYCH') {
        document.getElementById('navExport').innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/136/136443.png" class="icon" alt="JSON"> Generar JSON';
        document.getElementById('navExport').style.background = 'linear-gradient(135deg, #558800, #224400)';
    } else {
        document.getElementById('navExport').innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/2874/2874091.png" class="icon" alt="XML"> Solo Guardar XML';
        document.getElementById('navExport').style.background = 'linear-gradient(135deg, #008888, #005555)';
    }
}

function initMode(mode) { appMode = mode; toggleNavButtons(); if(mode === 'SCAN') openWindow('win-escaner'); if(mode === 'COMPRESS') openWindow('win-compresor'); }
const pensar = (ms) => new Promise(res => setTimeout(res, ms));
function showLoader(title, text) { document.getElementById('iaTitle').textContent = title; iaStatusTxt.innerHTML = text; iaLoader.style.display = 'flex'; }

// CARGA DE IMÁGENES Y XML
function loadMainImage(file, callback) {
    if(!file) return; showLoader("CARGANDO...", "Leyendo imagen PNG..."); nombreArchivo = file.name; 
    const reader = new FileReader();
    reader.onload = (event) => { 
        imgOriginal = new Image();
        imgOriginal.onload = () => { 
            spritesDetectados = []; canvas.width = imgOriginal.width; canvas.height = imgOriginal.height; 
            let rect = scanWrapper.getBoundingClientRect(); let scaleX = (rect.width - 40) / imgOriginal.width; let scaleY = (rect.height - 40) / imgOriginal.height;
            zoomActual = Math.min(1.0, scaleX, scaleY); if (zoomActual <= 0) zoomActual = 0.1; 
            panX = (rect.width - (imgOriginal.width * zoomActual)) / 2; panY = (rect.height - (imgOriginal.height * zoomActual)) / 2;
            if (typeof actualizarCSSCamera === 'function') actualizarCSSCamera(); 
            document.getElementById('iaLoader').style.display = 'none'; 
            if(callback) callback(); 
        }; 
        imgOriginal.onerror = () => { document.getElementById('iaLoader').style.display = 'none'; alert("❌ Error al cargar la imagen."); }
        imgOriginal.src = event.target.result; 
    };
    reader.onerror = () => { document.getElementById('iaLoader').style.display = 'none'; alert("❌ Error al leer el archivo."); }
    reader.readAsDataURL(file);
}

document.getElementById('imageInputScan').addEventListener('change', (e) => { loadMainImage(e.target.files[0], () => { document.getElementById('btnProcesar').style.display = 'flex'; }); });

let tI2=null, tX2=null, tI3=null, tX3=null;
document.getElementById('modImage').addEventListener('change', e => { tI2 = e.target.files[0]; checkDual('EDIT'); });
document.getElementById('modXML').addEventListener('change', e => { tX2 = e.target.files[0]; checkDual('EDIT'); });
document.getElementById('psychImage').addEventListener('change', e => { tI3 = e.target.files[0]; checkDual('PSYCH'); });
document.getElementById('psychXML').addEventListener('change', e => { tX3 = e.target.files[0]; checkDual('PSYCH'); });

function checkDual(mode) {
    let imgF = mode === 'EDIT' ? tI2 : tI3; let xmlF = mode === 'EDIT' ? tX2 : tX3;
    if(imgF && xmlF) {
        appMode = mode; toggleNavButtons(); 
        loadMainImage(imgF, () => { let reader = new FileReader(); reader.onload = (e) => { parseSparrowXML(e.target.result); finalizarCargaGeneral(mode); }; reader.readAsText(xmlF); });
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
            frameWidth: parseInt(st.getAttribute("frameWidth")) || w, frameHeight: parseInt(st.getAttribute("frameHeight")) || h, angle: st.getAttribute("rotated") === "true" ? 90 : 0
        });
    }
}

function finalizarCargaGeneral(mode) {
    if((mode === 'SCAN' || mode === 'EDIT') && typeof dibujarContornos === 'function') dibujarContornos();
    if(typeof actualizarDropdownFiltros === 'function') actualizarDropdownFiltros(); 
    if(typeof actualizarDropdownPsych === 'function') actualizarDropdownPsych();
    if(mode !== 'PSYCH' && typeof renderTimelineSecuenciador === 'function') renderTimelineSecuenciador();
    currentLoopFrameIdx = 0; 
    if (typeof updatePlayerInterval === 'function') updatePlayerInterval();
    if(spritesDetectados.length > 0 && typeof seleccionarFrameAfinador === 'function') seleccionarFrameAfinador(0);
    document.getElementById('iaLoader').style.display = 'none';
    if(mode === 'EDIT') openWindow('win-orden');
    if(mode === 'PSYCH') openWindow('win-psych');
}
