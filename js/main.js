// ==========================================
// 1. main.js - NÚCLEO GLOBAL, VARIABLES Y FUNCIONES
// ==========================================
const CURRENT_VERSION = '1.3';

window.onload = () => {
    const savedTheme = localStorage.getItem('iasprite_theme') || 'cyberpunk';
    changeTheme(savedTheme);

    const savedMode = localStorage.getItem('iasprite_darkmode');
    if (savedMode === 'true') {
        document.body.classList.add('dark-mode');
    }

    const lastVersion = localStorage.getItem('iasprite_version');

    if (!lastVersion) {
        let modWelcome = document.getElementById('welcomeModal');
        if (modWelcome) modWelcome.style.display = 'flex';
    } else if (lastVersion !== CURRENT_VERSION) {
        let modChangelog = document.getElementById('changelogModal');
        if (modChangelog) modChangelog.style.display = 'flex';
    }

    // Quitar el loader global despus de que todo carg
    setTimeout(() => {
        ocultarCargaGlobal();
    }, 500);
};

function mostrarCargaGlobal(mensaje) {
    let gl = document.getElementById('globalLoader');
    let gt = document.getElementById('globalLoaderText');
    if (gl) {
        if (gt) gt.innerText = mensaje || "Cargando...";
        gl.classList.remove('hidden');
    }
}

function ocultarCargaGlobal() {
    let gl = document.getElementById('globalLoader');
    if (gl) gl.classList.add('hidden');
}

window.closeWelcomeModal = function () {
    document.getElementById('welcomeModal').style.display = 'none';
    localStorage.setItem('iasprite_version', CURRENT_VERSION);
};

window.closeChangelogModal = function () {
    document.getElementById('changelogModal').style.display = 'none';
    localStorage.setItem('iasprite_version', CURRENT_VERSION);
};

function changeTheme(theme) {
    document.body.classList.remove('theme-psych', 'theme-bf');
    if (theme !== 'cyberpunk') document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('iasprite_theme', theme);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('iasprite_darkmode', isDark);
}

function togglePresetDropdown() {
    let dropdown = document.getElementById('presetDropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

function selectPreset(preset) {
    let input = document.getElementById('inputBatchName');
    if (input) input.value = preset;
    togglePresetDropdown();
}

window.onclick = function (event) {
    if (!event.target.matches('.dropdown-btn')) {
        let dropdown = document.getElementById('presetDropdown');
        if (dropdown && dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
        }
    }
}

var appMode = 'HOME'; var imgOriginal = new Image(); var nombreArchivo = "spritesheet.png";
var spritesDetectados = []; var psychAnimations = []; var indexEditando = null;

let zoomActual = 1.0; let panX = 0, panY = 0; let globalMode = 'VIEW';

const scanWrapper = document.getElementById('scanWrapper');
const canvas = document.getElementById('canvasSprites'); const ctx = canvas.getContext('2d');
const canvasPreview = document.getElementById('canvasPreview'); const ctxPreview = canvasPreview.getContext('2d');
const canvasLoopPlayer = document.getElementById('canvasLoopPlayer'); const ctxLoopPlayer = canvasLoopPlayer.getContext('2d');
const canvasPsychLive = document.getElementById('canvasPsychLive'); const ctxPsychLive = canvasPsychLive.getContext('2d');

const timelineContainer = document.getElementById('timelineContainer');
const selectAnimFilter = document.getElementById('selectAnimFilter');
const p_animPrefix = document.getElementById('p_animPrefix');
const psychAnimList = document.getElementById('psychAnimList');
// Variables removed

let playActive = true; let playInterval = null; let currentLoopFrameIdx = 0; let fpsActual = 24;
let psychLiveActiveAnimIdx = -1; let psychLiveFrameIdx = 0; let psychLiveInterval = null;

document.getElementById('sliderCorte').addEventListener('input', (e) => document.getElementById('valCorte').textContent = e.target.value);
document.getElementById('sliderUnion').addEventListener('input', (e) => document.getElementById('valUnion').textContent = e.target.value);
document.getElementById('sliderPad').addEventListener('input', (e) => document.getElementById('valPad').textContent = e.target.value);

window.autoRenumerar = function () {
    let contadores = {};
    spritesDetectados.forEach(s => {
        let prefijo = s.name.replace(/\d+$/, '');
        if (!prefijo) prefijo = "frame_";
        if (contadores[prefijo] === undefined) contadores[prefijo] = 0;
        s.name = prefijo + String(contadores[prefijo]).padStart(4, '0');
        contadores[prefijo]++;
    });
};

window.duplicateFrame = function (idx) {
    let original = spritesDetectados[idx]; let copy = JSON.parse(JSON.stringify(original));
    spritesDetectados.splice(idx + 1, 0, copy);
    if (indexEditando !== null && indexEditando > idx) { indexEditando++; }
    autoRenumerar();
    if (typeof renderTimelineSecuenciador === 'function') renderTimelineSecuenciador();
    if (typeof dibujarContornos === 'function') dibujarContornos();
    if (typeof actualizarDropdownFiltros === 'function') actualizarDropdownFiltros();
    if (typeof actualizarDropdownPsych === 'function') actualizarDropdownPsych();
};

window.duplicarActualAfinador = function () {
    if (indexEditando === null) return;
    duplicateFrame(indexEditando);
    if (typeof seleccionarFrameAfinador === 'function') seleccionarFrameAfinador(indexEditando + 1);
};

async function openWindow(winId) {
    mostrarCargaGlobal("Cargando seccin...");
    await pensar(50); // Mnima pausa para que el navegador renderice el blur

    document.querySelectorAll('.window-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.win-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(winId).classList.add('active');

    if (winId === 'win-home') document.getElementById('navHome').classList.add('active');
    if (winId === 'win-escaner') document.getElementById('navEscaner').classList.add('active');
    if (winId === 'win-orden') document.getElementById('navOrden').classList.add('active');
    if (winId === 'win-afinador') document.getElementById('navAfinador').classList.add('active');
    if (winId === 'win-psych') document.getElementById('navPsych').classList.add('active');
    if (winId === 'win-compresor') document.getElementById('navCompresor').classList.add('active');

    if (winId === 'win-afinador' && typeof renderizarPreviewTiempoReal === 'function') { renderizarPreviewTiempoReal(); updatePlayerInterval(); }
    if (winId === 'win-orden' && typeof renderTimelineSecuenciador === 'function') { renderTimelineSecuenciador(); }
    if (winId === 'win-psych' && typeof startPsychLiveLoop === 'function') { startPsychLiveLoop(); }
    if (winId === 'win-escaner' && typeof actualizarCSSCamera === 'function') { actualizarCSSCamera(); dibujarContornos(); }

    setTimeout(() => { ocultarCargaGlobal(); }, 200);
}

function toggleNavButtons() {
    document.getElementById('navEscaner').style.display = (appMode === 'SCAN') ? 'flex' : 'none';
    document.getElementById('navOrden').style.display = (appMode === 'SCAN' || appMode === 'EDIT') ? 'flex' : 'none';
    document.getElementById('navAfinador').style.display = (appMode === 'SCAN' || appMode === 'EDIT') ? 'flex' : 'none';
    document.getElementById('navPsych').style.display = (appMode === 'PSYCH') ? 'flex' : 'none';
    document.getElementById('navCompresor').style.display = (appMode === 'COMPRESS') ? 'flex' : 'none';
    document.getElementById('navAudio').style.display = (appMode === 'AUDIO') ? 'flex' : 'none';
    document.getElementById('navAtlas').style.display = (appMode === 'ATLAS') ? 'flex' : 'none';

    document.getElementById('navPack').style.display = (appMode === 'EDIT' || appMode === 'SCAN') ? 'flex' : 'none';
    document.getElementById('navExport').style.display = (appMode === 'EDIT' || appMode === 'SCAN' || appMode === 'PSYCH') ? 'flex' : 'none';

    if (appMode === 'PSYCH') {
        document.getElementById('navExport').innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/136/136443.png" class="icon" alt="JSON"> Generar JSON';
        document.getElementById('navExport').style.background = 'linear-gradient(135deg, #558800, #224400)';
    } else {
        document.getElementById('navExport').innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/2874/2874091.png" class="icon" alt="XML"> Solo Guardar XML';
        document.getElementById('navExport').style.background = 'linear-gradient(135deg, #008888, #005555)';
    }
}

function initMode(mode) {
    appMode = mode;
    toggleNavButtons();
    if (mode === 'SCAN') openWindow('win-escaner');
    if (mode === 'COMPRESS') openWindow('win-compresor');
    if (mode === 'AUDIO') openWindow('win-audio');
    if (mode === 'ATLAS') openWindow('win-atlas');
    if (typeof window.autoSaveHistory === 'function') window.autoSaveHistory();
}
const pensar = (ms) => new Promise(res => setTimeout(res, ms));
function showLoader(titulo, mensaje) {
    mostrarCargaGlobal(titulo + " - " + mensaje);
}

function loadMainImage(file, callback) {
    if (!file) return; mostrarCargaGlobal("Cargando imagen PNG..."); nombreArchivo = file.name;
    window.lastResizeFactor = 1.0;
    const reader = new FileReader();
    reader.onload = (event) => {
        imgOriginal = new Image();
        imgOriginal.onload = () => {
            spritesDetectados = []; canvas.width = imgOriginal.width; canvas.height = imgOriginal.height;
            let rect = scanWrapper.getBoundingClientRect(); let scaleX = (rect.width - 40) / imgOriginal.width; let scaleY = (rect.height - 40) / imgOriginal.height;
            zoomActual = Math.min(1.0, scaleX, scaleY); if (zoomActual <= 0) zoomActual = 0.1;
            panX = (rect.width - (imgOriginal.width * zoomActual)) / 2; panY = (rect.height - (imgOriginal.height * zoomActual)) / 2;
            if (typeof actualizarCSSCamera === 'function') actualizarCSSCamera();
            ocultarCargaGlobal();
            if (callback) callback();
        };
        imgOriginal.onerror = () => { ocultarCargaGlobal(); alert("❌ Error al cargar la imagen."); }
        imgOriginal.src = event.target.result;
    };
    reader.onerror = () => { ocultarCargaGlobal(); alert("❌ Error al leer el archivo."); }
    reader.readAsDataURL(file);
}

document.getElementById('imageInputScan').addEventListener('change', (e) => { loadMainImage(e.target.files[0], () => { document.getElementById('btnProcesar').style.display = 'flex'; }); });

let tI2 = null, tX2 = null, tI3 = null, tX3 = null;
document.getElementById('modImage').addEventListener('change', e => { tI2 = e.target.files[0]; checkDual('EDIT'); });
document.getElementById('modXML').addEventListener('change', e => { tX2 = e.target.files[0]; checkDual('EDIT'); });
document.getElementById('psychImage').addEventListener('change', e => { tI3 = e.target.files[0]; checkDual('PSYCH'); });
document.getElementById('psychXML').addEventListener('change', e => { tX3 = e.target.files[0]; checkDual('PSYCH'); });

function checkDual(mode) {
    let imgF = mode === 'EDIT' ? tI2 : tI3; let xmlF = mode === 'EDIT' ? tX2 : tX3;
    if (imgF && xmlF) {
        appMode = mode; toggleNavButtons();
        loadMainImage(imgF, () => { let reader = new FileReader(); reader.onload = (e) => { parseSparrowXML(e.target.result); finalizarCargaGeneral(mode); }; reader.readAsText(xmlF); });
    }
}

function parseSparrowXML(xmlString) {
    let parser = new DOMParser(); let xmlDoc = parser.parseFromString(xmlString, "text/xml");
    let subTextures = xmlDoc.getElementsByTagName("SubTexture"); spritesDetectados = [];
    for (let i = 0; i < subTextures.length; i++) {
        let st = subTextures[i]; let w = parseInt(st.getAttribute("width")); let h = parseInt(st.getAttribute("height"));
        spritesDetectados.push({
            name: st.getAttribute("name"), x: parseInt(st.getAttribute("x")), y: parseInt(st.getAttribute("y")), w: w, h: h,
            frameX: parseInt(st.getAttribute("frameX")) || 0, frameY: parseInt(st.getAttribute("frameY")) || 0,
            frameWidth: parseInt(st.getAttribute("frameWidth")) || w, frameHeight: parseInt(st.getAttribute("frameHeight")) || h, angle: st.getAttribute("rotated") === "true" ? 90 : 0
        });
    }
}

function finalizarCargaGeneral(mode) {
    if ((mode === 'SCAN' || mode === 'EDIT') && typeof dibujarContornos === 'function') dibujarContornos();
    if (typeof actualizarDropdownFiltros === 'function') actualizarDropdownFiltros();
    if (typeof actualizarDropdownPsych === 'function') actualizarDropdownPsych();
    if (typeof actualizarLabelResolucion === 'function') actualizarLabelResolucion();
    if (mode !== 'PSYCH' && typeof renderTimelineSecuenciador === 'function') renderTimelineSecuenciador();
    currentLoopFrameIdx = 0;
    if (typeof updatePlayerInterval === 'function') updatePlayerInterval();
    if (spritesDetectados.length > 0 && typeof seleccionarFrameAfinador === 'function') seleccionarFrameAfinador(0);
    ocultarCargaGlobal();
    if (mode === 'EDIT') openWindow('win-orden');
    if (mode === 'PSYCH') openWindow('win-psych');

    if (typeof window.autoSaveHistory === 'function') window.autoSaveHistory();
}

window.addEventListener('dragover', (e) => {
    e.preventDefault();
    document.getElementById('dragOverlay').classList.add('active');
});

window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (e.clientX === 0 || e.clientY === 0) {
        document.getElementById('dragOverlay').classList.remove('active');
    }
});

window.addEventListener('drop', (e) => {
    e.preventDefault();
    document.getElementById('dragOverlay').classList.remove('active');

    if (e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach(file => {
            let ext = file.name.split('.').pop().toLowerCase();

            if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
                if (appMode === 'COMPRESS') {
                    const dt = new DataTransfer(); dt.items.add(file);
                    document.getElementById('imgCompresorUpload').files = dt.files;
                    document.getElementById('imgCompresorUpload').dispatchEvent(new Event('change'));
                } else if (appMode === 'EDIT') {
                    tI2 = file; checkDual('EDIT');
                } else if (appMode === 'PSYCH') {
                    tI3 = file; checkDual('PSYCH');
                } else {
                    loadMainImage(file, () => { document.getElementById('btnProcesar').style.display = 'flex'; });
                }
            } else if (ext === 'xml') {
                if (appMode === 'PSYCH') {
                    tX3 = file; checkDual('PSYCH');
                } else {
                    tX2 = file; checkDual('EDIT');
                }
            } else if (ext === 'ogg' || ext === 'mp3') {
                const dt = new DataTransfer(); dt.items.add(file);
                document.getElementById('audioUpload').files = dt.files;
                document.getElementById('audioUpload').dispatchEvent(new Event('change'));
            } else if (ext === 'json') {
                if (typeof handleAtlasFileDrop === 'function') handleAtlasFileDrop(file);
            }
        });
    }
});

// ==========================================
// LAZY LOADING: IMÁGENES CON SPINNER ADAPTATIVO
// ==========================================
(function initImageLazyLoad() {
    // Estilo del spinner inline para imágenes
    const spinnerCSS = document.createElement('style');
    spinnerCSS.textContent = `
        .img-lazy-wrap {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .img-lazy-wrap img {
            opacity: 0;
            transition: opacity 0.4s ease;
        }
        .img-lazy-wrap img.img-loaded {
            opacity: 1;
        }
        .img-mini-spinner {
            position: absolute;
            border: 2px solid rgba(255,255,255,0.15);
            border-top-color: var(--accent, #00e5ff);
            border-radius: 50%;
            animation: imgSpin 0.7s linear infinite;
        }
        @keyframes imgSpin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(spinnerCSS);

    function wrapImage(img) {
        if (img.closest('.img-lazy-wrap')) return; // Ya envuelto
        if (img.closest('#globalLoader')) return;  // No tocar el loader
        if (img.closest('.timeline-item')) return;  // No tocar los canvas
        if (img.naturalWidth > 0 && img.complete) {
            img.classList.add('img-loaded');
            return;
        }

        const wrap = document.createElement('span');
        wrap.className = 'img-lazy-wrap';
        
        const spinner = document.createElement('span');
        spinner.className = 'img-mini-spinner';

        // Adaptar tamaño del spinner a la imagen
        let imgW = img.width || img.offsetWidth || 20;
        let imgH = img.height || img.offsetHeight || 20;
        let spinSize = Math.max(10, Math.min(imgW, imgH, 24));
        spinner.style.width = spinSize + 'px';
        spinner.style.height = spinSize + 'px';

        img.parentNode.insertBefore(wrap, img);
        wrap.appendChild(spinner);
        wrap.appendChild(img);

        img.addEventListener('load', function onLoad() {
            img.classList.add('img-loaded');
            if (spinner.parentNode) spinner.remove();
        }, { once: true });

        img.addEventListener('error', function onErr() {
            if (spinner.parentNode) spinner.remove();
            img.style.opacity = '0.3';
        }, { once: true });

        // Forzar recarga si la imagen ya estaba cacheada
        if (img.complete && img.naturalWidth > 0) {
            img.classList.add('img-loaded');
            spinner.remove();
        }
    }

    // Envolver las imágenes existentes al cargar
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('img:not(.img-loaded)').forEach(wrapImage);
    });

    // Observer para imágenes que se agregan dinámicamente
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.tagName === 'IMG') wrapImage(node);
                    else if (node.querySelectorAll) {
                        node.querySelectorAll('img:not(.img-loaded)').forEach(wrapImage);
                    }
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
