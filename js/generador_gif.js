let modoActual = null;
let archivosSueltos = [];
let imgSpritesheet = null;
let xmlDoc = null;
let spritesXML = [];
let animacionesDisponibles = {};

function seleccionarModo(modo) {
    modoActual = modo;
    document.querySelectorAll('.gif-mode-card').forEach(c => c.classList.remove('selected'));
    let card = document.getElementById('cardModo' + modo);
    if (card) card.classList.add('selected');

    document.getElementById('fileInputsContainer').style.display = 'block';
    let dropText = "";
    
    if (modo === 'A') {
        dropText = "Sube tus imágenes sueltas (.png, .jpg)";
        document.getElementById('gifInputArchivos').accept = "image/*";
        document.getElementById('gifInputArchivos').multiple = true;
    } else if (modo === 'B') {
        dropText = "Sube tu hoja de sprites (.png)";
        document.getElementById('gifInputArchivos').accept = "image/png, image/jpeg";
        document.getElementById('gifInputArchivos').multiple = false;
    } else if (modo === 'C') {
        dropText = "Sube tu XML y tu PNG juntos";
        document.getElementById('gifInputArchivos').accept = "*/*";
        document.getElementById('gifInputArchivos').multiple = true;
    }
    
    document.getElementById('gifDropZoneText').innerText = dropText;
    document.getElementById('gifWorkspace').style.display = 'none';
    
    // Reseteamos datos
    archivosSueltos = [];
    imgSpritesheet = null;
    xmlDoc = null;
    spritesXML = [];
    animacionesDisponibles = {};
    document.getElementById('selectAnimacionXML').innerHTML = '<option value="">Carga un XML primero...</option>';
}

let tempXmlFile = null;
let tempPngFile = null;

// =======================
// MODO C: XML + PNG
// =======================
document.getElementById('gifXmlUpload')?.addEventListener('change', async (e) => {
    let files = Array.from(e.target.files);
    if(files.length > 0) {
        tempXmlFile = files[0];
        e.target.nextElementSibling.style.background = '#4caf50';
        e.target.nextElementSibling.style.color = '#fff';
    }
    checkModoC();
});
document.getElementById('gifPngUpload')?.addEventListener('change', async (e) => {
    let files = Array.from(e.target.files);
    if(files.length > 0) {
        tempPngFile = files[0];
        e.target.nextElementSibling.style.background = '#4caf50';
        e.target.nextElementSibling.style.color = '#fff';
    }
    checkModoC();
});

async function checkModoC() {
    if(tempXmlFile && tempPngFile) {
        mostrarCargaGlobal("Procesando archivos...");
        imgSpritesheet = await fileToImage(tempPngFile);
        let xmlText = await tempXmlFile.text();
        let parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        // Reset temporales
        tempXmlFile = null; 
        tempPngFile = null;
        
        iniciarModoC();
        ocultarCargaGlobal();
    }
}

// =======================
// MODO B: Solo PNG
// =======================
document.getElementById('gifPngUnicoUpload')?.addEventListener('change', async (e) => {
    let files = Array.from(e.target.files);
    if(files.length > 0) {
        mostrarCargaGlobal("Procesando spritesheet...");
        imgSpritesheet = await fileToImage(files[0]);
        iniciarModoB();
        ocultarCargaGlobal();
    }
});

// =======================
// MODO A: Sueltas
// =======================
document.getElementById('gifSueltasUpload')?.addEventListener('change', async (e) => {
    let files = Array.from(e.target.files);
    if(files.length > 0) {
        mostrarCargaGlobal("Procesando imágenes...");
        archivosSueltos = files.filter(f => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.png') || f.name.toLowerCase().endsWith('.jpg'));
        iniciarModoA();
        ocultarCargaGlobal();
    }
});

function fileToImage(file) {
    return new Promise((resolve) => {
        let reader = new FileReader();
        reader.onload = (e) => {
            let img = new Image();
            img.onload = () => resolve(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function iniciarModoA() {
    document.getElementById('gifWorkspace').style.display = 'flex';
    let selector = document.getElementById('xmlAnimSelector');
    if(selector) selector.style.display = 'none';
    
    window.framesPreRenderizados = [];
    
    // Sort files by name so they are in sequence
    archivosSueltos.sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));
    
    for(let i=0; i<archivosSueltos.length; i++) {
        let img = await fileToImage(archivosSueltos[i]);
        let c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        let ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        window.framesPreRenderizados.push(c.toDataURL('image/png'));
    }
    
    document.getElementById('txtFrameCount').textContent = `${window.framesPreRenderizados.length} Frames`;
    document.getElementById('previewPlaceholder').style.display = 'none';
    document.getElementById('previewGifImg').style.display = 'block';
    document.getElementById('btnGenerarGif').style.display = 'block';
    document.getElementById('btnDescargarGif').style.display = 'none';
    
    let seq = document.getElementById('gifSequencer');
    if(seq) seq.style.display = 'block';
    
    renderizarSecuenciadorGif();
    actualizarBPM();
}

let gifCajas = [];
let isGifDrawing = false;
let gifStartX = 0;
let gifStartY = 0;

async function iniciarModoB() {
    document.getElementById('gifWorkspace').style.display = 'flex';
    let selector = document.getElementById('xmlAnimSelector');
    if(selector) selector.style.display = 'none';
    
    // Hide preview stuff until extracted
    document.querySelector('.preview-box').style.display = 'none';
    document.getElementById('btnGenerarGif').style.display = 'none';
    let seq = document.getElementById('gifSequencer');
    if(seq) seq.style.display = 'none';
    
    // Show crop container
    let cropCont = document.getElementById('gifCropContainer');
    if(cropCont) cropCont.style.display = 'block';
    
    let canvas = document.getElementById('gifCropCanvas');
    if(!canvas) return;
    
    canvas.width = imgSpritesheet.width;
    canvas.height = imgSpritesheet.height;
    
    gifCajas = [];
    dibujarGifCrop();
}

function dibujarGifCrop() {
    let canvas = document.getElementById('gifCropCanvas');
    if(!canvas) return;
    let ctx = canvas.getContext('2d');
    
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(imgSpritesheet, 0, 0);
    
    gifCajas.forEach((caja, index) => {
        ctx.strokeStyle = '#31b0d1';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(caja.x, caja.y, caja.w, caja.h);
        
        ctx.fillStyle = '#31b0d1';
        ctx.font = 'bold 16px sans-serif';
        ctx.setLineDash([]);
        ctx.fillText(index + 1, caja.x + 4, caja.y + 18);
    });
}

function limpiarCajasGif() {
    gifCajas = [];
    dibujarGifCrop();
}

function extraerFramesGif() {
    if(gifCajas.length === 0) {
        alert("¡No has dibujado ningún recuadro! Dibuja sobre los frames que quieres animar.");
        return;
    }
    
    window.framesPreRenderizados = [];
    
    gifCajas.forEach(caja => {
        let c = document.createElement('canvas');
        c.width = caja.w;
        c.height = caja.h;
        let ctx = c.getContext('2d');
        ctx.drawImage(imgSpritesheet, caja.x, caja.y, caja.w, caja.h, 0, 0, caja.w, caja.h);
        window.framesPreRenderizados.push(c.toDataURL('image/png'));
    });
    
    document.getElementById('gifCropContainer').style.display = 'none';
    document.querySelector('.preview-box').style.display = 'block';
    document.getElementById('txtFrameCount').textContent = `${window.framesPreRenderizados.length} Frames`;
    document.getElementById('previewPlaceholder').style.display = 'none';
    document.getElementById('previewGifImg').style.display = 'block';
    document.getElementById('btnGenerarGif').style.display = 'block';
    
    let seq = document.getElementById('gifSequencer');
    if(seq) seq.style.display = 'block';
    
    renderizarSecuenciadorGif();
    actualizarBPM();
}

// Eventos del canvas
document.addEventListener('DOMContentLoaded', () => {
    let canvas = document.getElementById('gifCropCanvas');
    if(canvas) {
        let getPos = (e) => {
            let rect = canvas.getBoundingClientRect();
            // Handle touch or mouse
            let clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let clientY = e.touches ? e.touches[0].clientY : e.clientY;
            let scaleX = canvas.width / rect.width;
            let scaleY = canvas.height / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const startDraw = (e) => {
            if(e.touches && e.touches.length > 1) return; // ignore multi-touch
            e.preventDefault();
            let pos = getPos(e);
            isGifDrawing = true;
            gifStartX = pos.x;
            gifStartY = pos.y;
            gifCajas.push({x: gifStartX, y: gifStartY, w: 0, h: 0});
        };

        const doDraw = (e) => {
            if(!isGifDrawing) return;
            e.preventDefault();
            let pos = getPos(e);
            let currentBox = gifCajas[gifCajas.length - 1];
            currentBox.w = pos.x - gifStartX;
            currentBox.h = pos.y - gifStartY;
            
            // Normalize negatives if drawn backwards
            if(currentBox.w < 0) { currentBox.x = pos.x; currentBox.w = Math.abs(currentBox.w); } else { currentBox.x = gifStartX; }
            if(currentBox.h < 0) { currentBox.y = pos.y; currentBox.h = Math.abs(currentBox.h); } else { currentBox.y = gifStartY; }
            
            dibujarGifCrop();
        };

        const endDraw = (e) => {
            if(!isGifDrawing) return;
            isGifDrawing = false;
            let currentBox = gifCajas[gifCajas.length - 1];
            if(currentBox.w < 10 || currentBox.h < 10) {
                gifCajas.pop(); // Too small, ignore
            }
            dibujarGifCrop();
        };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', doDraw);
        window.addEventListener('mouseup', endDraw); // attach to window to catch releases outside
        
        canvas.addEventListener('touchstart', startDraw, {passive: false});
        canvas.addEventListener('touchmove', doDraw, {passive: false});
        window.addEventListener('touchend', endDraw);
    }
});

function iniciarModoC() {
    document.getElementById('gifWorkspace').style.display = 'flex';
    document.getElementById('xmlAnimSelector').style.display = 'block';
    
    // Parsear XML
    spritesXML = [];
    animacionesDisponibles = {};
    
    let subtextures = xmlDoc.getElementsByTagName('SubTexture');
    for(let i=0; i<subtextures.length; i++) {
        let st = subtextures[i];
        let name = st.getAttribute('name');
        // Quitar los números finales para agrupar
        let prefix = name.replace(/[0-9]+$/, '').trim();
        
        let frame = {
            name: name,
            x: parseInt(st.getAttribute('x')) || 0,
            y: parseInt(st.getAttribute('y')) || 0,
            width: parseInt(st.getAttribute('width')) || 0,
            height: parseInt(st.getAttribute('height')) || 0,
            frameX: parseInt(st.getAttribute('frameX')) || 0,
            frameY: parseInt(st.getAttribute('frameY')) || 0,
            frameWidth: parseInt(st.getAttribute('frameWidth')) || parseInt(st.getAttribute('width')),
            frameHeight: parseInt(st.getAttribute('frameHeight')) || parseInt(st.getAttribute('height'))
        };
        
        spritesXML.push(frame);
        
        if(!animacionesDisponibles[prefix]) {
            animacionesDisponibles[prefix] = [];
        }
        animacionesDisponibles[prefix].push(frame);
    }
    
    let selector = document.getElementById('selectAnimacionXML');
    selector.innerHTML = '';
    
    for (let anim in animacionesDisponibles) {
        let opt = document.createElement('option');
        opt.value = anim;
        opt.textContent = `${anim} (${animacionesDisponibles[anim].length} frames)`;
        selector.appendChild(opt);
    }
    
    selector.onchange = actualizarVistaPrevia;
    actualizarVistaPrevia();
}

let animTimer = null;
window.framesPreRenderizados = [];

function actualizarBPM() {
    let bpm = document.getElementById('sliderBpm').value;
    document.getElementById('lblBpm').textContent = bpm;
    
    let fps = Math.round((bpm / 100) * 24);
    if(fps < 5) fps = 5;
    if(fps > 60) fps = 60;
    document.getElementById('lblFps').textContent = `(= ${fps} FPS)`;
    
    if(window.framesPreRenderizados.length > 0) {
        iniciarAnimacionPreview(fps);
    }
}

async function actualizarVistaPrevia() {
    let prefix = document.getElementById('selectAnimacionXML').value;
    if(!prefix) return;
    
    let frames = animacionesDisponibles[prefix];
    document.getElementById('txtFrameCount').textContent = `${frames.length} Frames`;
    
    // Generar canvas de cada frame
    window.framesPreRenderizados = [];
    
    let maxWidth = 0;
    let maxHeight = 0;
    frames.forEach(f => {
        if(f.frameWidth > maxWidth) maxWidth = f.frameWidth;
        if(f.frameHeight > maxHeight) maxHeight = f.frameHeight;
    });
    
    for (let i=0; i<frames.length; i++) {
        let f = frames[i];
        let c = document.createElement('canvas');
        c.width = maxWidth;
        c.height = maxHeight;
        let ctx = c.getContext('2d');
        
        let dx = Math.abs(f.frameX);
        let dy = Math.abs(f.frameY);
        
        ctx.drawImage(imgSpritesheet, f.x, f.y, f.width, f.height, dx, dy, f.width, f.height);
        window.framesPreRenderizados.push(c.toDataURL('image/png'));
    }
    
    document.getElementById('previewPlaceholder').style.display = 'none';
    document.getElementById('previewGifImg').style.display = 'block';
    document.getElementById('btnGenerarGif').style.display = 'block';
    document.getElementById('btnDescargarGif').style.display = 'none';
    
    document.getElementById('gifSequencer').style.display = 'block';
    renderizarSecuenciadorGif();
    actualizarBPM();
}

function renderizarSecuenciadorGif() {
    let track = document.getElementById('gifSequencerTrack');
    track.innerHTML = '';
    
    window.framesPreRenderizados.forEach((frameData, index) => {
        let card = document.createElement('div');
        card.style.cssText = "position:relative; width:80px; height:80px; background:#fff; border-radius:5px; flex-shrink:0; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.5); border: 2px solid #555;";
        
        let img = document.createElement('img');
        img.src = frameData;
        img.style.cssText = "max-width:100%; max-height:100%; object-fit:contain;";
        card.appendChild(img);
        
        let numBadge = document.createElement('div');
        numBadge.style.cssText = "position:absolute; bottom:2px; left:2px; background:rgba(0,0,0,0.7); color:#fff; font-size:10px; font-weight:bold; padding:2px 4px; border-radius:3px;";
        numBadge.innerText = (index + 1);
        card.appendChild(numBadge);
        
        // Btn Duplicate
        let btnDup = document.createElement('div');
        btnDup.innerHTML = "+";
        btnDup.style.cssText = "position:absolute; top:-5px; right:15px; width:20px; height:20px; background:#4CAF50; color:#fff; border-radius:50%; text-align:center; line-height:20px; font-weight:bold; cursor:pointer; font-size:14px; z-index:10;";
        btnDup.onclick = () => {
            window.framesPreRenderizados.splice(index + 1, 0, frameData);
            document.getElementById('txtFrameCount').textContent = `${window.framesPreRenderizados.length} Frames`;
            renderizarSecuenciadorGif();
            actualizarBPM();
        };
        card.appendChild(btnDup);
        
        // Btn Delete
        let btnDel = document.createElement('div');
        btnDel.innerHTML = "×";
        btnDel.style.cssText = "position:absolute; top:-5px; right:-5px; width:20px; height:20px; background:#f44336; color:#fff; border-radius:50%; text-align:center; line-height:18px; font-weight:bold; cursor:pointer; font-size:16px; z-index:10;";
        btnDel.onclick = () => {
            if(window.framesPreRenderizados.length > 1) {
                window.framesPreRenderizados.splice(index, 1);
                document.getElementById('txtFrameCount').textContent = `${window.framesPreRenderizados.length} Frames`;
                renderizarSecuenciadorGif();
                actualizarBPM();
            } else {
                alert("No puedes eliminar el último frame.");
            }
        };
        card.appendChild(btnDel);
        
        track.appendChild(card);
    });
}

let currFrameIndex = 0;
function iniciarAnimacionPreview(fps) {
    clearInterval(animTimer);
    let msPerFrame = 1000 / fps;
    currFrameIndex = 0;
    
    let imgEl = document.getElementById('previewGifImg');
    if(window.framesPreRenderizados.length > 0) {
        imgEl.src = window.framesPreRenderizados[0];
    }
    
    animTimer = setInterval(() => {
        if(window.framesPreRenderizados.length === 0) return;
        currFrameIndex = (currFrameIndex + 1) % window.framesPreRenderizados.length;
        imgEl.src = window.framesPreRenderizados[currFrameIndex];
    }, msPerFrame);
}

function generarGif() {
    if(window.framesPreRenderizados.length === 0) return;
    
    let bpm = document.getElementById('sliderBpm').value;
    let fps = Math.round((bpm / 100) * 24);
    if(fps < 5) fps = 5;
    if(fps > 60) fps = 60;
    
    let intervalSecs = 1 / fps;
    
    mostrarCargaGlobal("Codificando la animación, por favor espera...<br><span style='color:var(--accent-pink); font-size: 0.8rem;'>⚠️ Tu pantalla se congelará un momento, es normal.</span>");
    
    setTimeout(() => {
        gifshot.createGIF({
            images: window.framesPreRenderizados,
            gifWidth: document.getElementById('previewGifImg').naturalWidth || 300,
            gifHeight: document.getElementById('previewGifImg').naturalHeight || 300,
            interval: intervalSecs,
            numFrames: window.framesPreRenderizados.length,
            sampleInterval: 10,
            progressCallback: function(captureProgress) {
                // Not possible to show progress nicely because it blocks main thread if no workers
            }
        }, function(obj) {
            ocultarCargaGlobal();
            if(!obj.error) {
                let image = obj.image;
                document.getElementById('previewGifImg').src = image;
                clearInterval(animTimer); // Detener el loop manual de canvas
                
                let btnDown = document.getElementById('btnDescargarGif');
                btnDown.href = image;
                btnDown.download = document.getElementById('selectAnimacionXML').value + ".gif";
                
                document.getElementById('btnGenerarGif').style.display = 'none';
                btnDown.style.display = 'block';
            } else {
                alert("❌ Hubo un error al generar el GIF.");
            }
        });
    }, 500);
}
