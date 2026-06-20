// ==========================================
// SECUENCIADOR Y EXPORTACIÓN ZIP
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
function deleteFrame(idx) { spritesDetectados.splice(idx, 1); if(indexEditando === idx) indexEditando = null; autoRenumerar(); renderTimelineSecuenciador(); dibujarContornos(); actualizarDropdownFiltros(); actualizarDropdownPsych(); }

document.getElementById('btnAplicarBatch').addEventListener('click', () => {
    let prefijo = document.getElementById('inputBatchName').value.trim(); if (!prefijo) return alert("❌ Escribe un prefijo.");
    let casillas = document.querySelectorAll('.frame-checkbox:checked'); if (casillas.length === 0) return alert("❌ Selecciona almenos un frame.");
    casillas.forEach((cb) => { let indice = parseInt(cb.getAttribute('data-index')); spritesDetectados[indice].name = prefijo + "0000"; });
    autoRenumerar(); actualizarDropdownFiltros(); actualizarDropdownPsych(); renderTimelineSecuenciador(); document.getElementById('inputBatchName').value = '';
});

document.getElementById('btnSelectAll').addEventListener('click', () => { let chks = document.querySelectorAll('.frame-checkbox'); let anyUnchecked = Array.from(chks).some(c => !c.checked); chks.forEach(cb => cb.checked = anyUnchecked); });

function actualizarDropdownFiltros() {
    let current = selectAnimFilter.value; selectAnimFilter.innerHTML = '<option value="ALL">-- Reproduciendo Todo --</option>';
    let prefijos = new Set(); spritesDetectados.forEach(s => { let base = s.name.replace(/\d+$/, ''); if(base) prefijos.add(base); });
    prefijos.forEach(p => { let opt = document.createElement('option'); opt.value = p; opt.textContent = p; selectAnimFilter.appendChild(opt); });
    if([...prefijos].includes(current)) selectAnimFilter.value = current;
}

function seleccionarFrameAfinador(index) {
    if(spritesDetectados.length === 0) return; indexEditando = index; let s = spritesDetectados[index];
    document.getElementById('lblCurrentFrame').innerHTML = `<img src="https://cdn-icons-png.flaticon.com/128/5157/5157510.png" class="icon" alt="Sel"> ${s.name}`;
    ['frameX','frameY','frameWidth','frameHeight','w','h'].forEach(p => document.getElementById(`inp_${p}`).value = s[p]);
    document.getElementById('btnToggleRotar').innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/2549/2549884.png" class="icon" alt="Rot"> Rotar (${s.angle || 0}°)`; document.getElementById('btnToggleRotar').style.color = (s.angle > 0) ? 'var(--accent-pink)' : 'white'; renderizarPreviewTiempoReal();
}
function prevFrame() { if(spritesDetectados.length===0) return; seleccionarFrameAfinador((indexEditando===null||indexEditando===0) ? spritesDetectados.length-1 : indexEditando-1); }
function nextFrame() { if(spritesDetectados.length===0) return; seleccionarFrameAfinador((indexEditando===null||indexEditando===spritesDetectados.length-1) ? 0 : indexEditando+1); }

function renderizarPreviewTiempoReal() {
    if (indexEditando === null || spritesDetectados.length === 0) return; let s = spritesDetectados[indexEditando]; let fw = s.frameWidth || s.w; let fh = s.frameHeight || s.h;
    canvasPreview.width = Math.max(fw, fh) + 40; canvasPreview.height = Math.max(fw, fh) + 40; ctxPreview.clearRect(0,0,canvasPreview.width,canvasPreview.height); ctxPreview.fillStyle = "#04040a"; ctxPreview.fillRect(0,0,canvasPreview.width,canvasPreview.height);
    ctxPreview.save(); ctxPreview.translate(canvasPreview.width/2 - fw/2, canvasPreview.height/2 - fh/2); ctxPreview.strokeStyle = "rgba(255, 255, 255, 0.3)"; ctxPreview.strokeRect(0, 0, fw, fh);
    ctxPreview.strokeStyle = "rgba(0, 229, 255, 0.2)"; ctxPreview.beginPath(); ctxPreview.moveTo(fw/2, 0); ctxPreview.lineTo(fw/2, fh); ctxPreview.moveTo(0, fh/2); ctxPreview.lineTo(fw, fh/2); ctxPreview.stroke();
    let drawX = -s.frameX; let drawY = -s.frameY; ctxPreview.translate(drawX + s.w/2, drawY + s.h/2); ctxPreview.rotate((s.angle || 0) * Math.PI / 180); ctxPreview.drawImage(imgOriginal, s.x, s.y, s.w, s.h, -s.w/2, -s.h/2, s.w, s.h); ctxPreview.restore();
}

function changeProp(p, v) { if(indexEditando===null) return; spritesDetectados[indexEditando][p] = parseInt(v)||0; renderizarPreviewTiempoReal(); dibujarContornos(); }
function incProp(p, amt) { if(indexEditando===null) return; spritesDetectados[indexEditando][p] = (parseInt(spritesDetectados[indexEditando][p])||0)+amt; document.getElementById(`inp_${p}`).value = spritesDetectados[indexEditando][p]; renderizarPreviewTiempoReal(); dibujarContornos(); }
document.getElementById('btnToggleRotar').addEventListener('click', () => { if(indexEditando === null) return; let s = spritesDetectados[indexEditando]; s.angle = ((s.angle || 0) + 90) % 360; seleccionarFrameAfinador(indexEditando); dibujarContornos(); });
selectAnimFilter.addEventListener('change', () => { currentLoopFrameIdx = 0; updatePlayerInterval(); });

function updatePlayerInterval() {
    clearInterval(playInterval); if (!playActive || spritesDetectados.length === 0) return;
    canvasLoopPlayer.width = 400; canvasLoopPlayer.height = 400;
    playInterval = setInterval(() => {
        let filtro = selectAnimFilter.value; let framesLoop = spritesDetectados.filter(s => filtro === 'ALL' ? true : s.name.replace(/\d+$/, '') === filtro);
        if (framesLoop.length === 0) { ctxLoopPlayer.clearRect(0,0,400,400); return; }
        if (currentLoopFrameIdx >= framesLoop.length) currentLoopFrameIdx = 0; let s = framesLoop[currentLoopFrameIdx];
        ctxLoopPlayer.clearRect(0, 0, 400,400); ctxLoopPlayer.fillStyle = "#04040a"; ctxLoopPlayer.fillRect(0, 0, 400,400);
        ctxLoopPlayer.save(); ctxLoopPlayer.translate(200, 200); 
        let maxDim = Math.max(s.w, s.h, s.frameWidth || 0, s.frameHeight || 0); if (maxDim > 300) { let scale = 300 / maxDim; ctxLoopPlayer.scale(scale, scale); }
        let drawX = -s.frameX - (s.frameWidth || s.w) / 2; let drawY = -s.frameY - (s.frameHeight || s.h) / 2;
        ctxLoopPlayer.translate(drawX + s.w/2, drawY + s.h/2); ctxLoopPlayer.rotate((s.angle || 0) * Math.PI / 180); ctxLoopPlayer.drawImage(imgOriginal, s.x, s.y, s.w, s.h, -s.w/2, -s.h/2, s.w, s.h); ctxLoopPlayer.restore(); currentLoopFrameIdx++;
    }, 1000 / fpsActual);
}

document.getElementById('btnPlayPause').addEventListener('click', () => { playActive = !playActive; let icono = playActive ? '3249/3249396.png' : '27/27223.png'; document.getElementById('btnPlayPause').innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/${icono}" class="icon" alt="PlayPause"> ` + (playActive ? "PAUSAR" : "REANUDAR"); updatePlayerInterval(); });
document.getElementById('btnFpsUp').addEventListener('click', () => { if (fpsActual < 60) { fpsActual++; document.getElementById('txtFpsDisplay').textContent = `${fpsActual} FPS`; updatePlayerInterval(); } });
document.getElementById('btnFpsDown').addEventListener('click', () => { if (fpsActual > 1) { fpsActual--; document.getElementById('txtFpsDisplay').textContent = `${fpsActual} FPS`; updatePlayerInterval(); } });

async function repackAndExport() {
    if(spritesDetectados.length === 0) return alert("No hay frames para empaquetar.");
    showLoader("OPTIMIZADOR", "Comprimiendo .XML + .PNG en .ZIP..."); await pensar(500);

    let uniqueFrames = []; let duplicatesMap = new Map(); let hashMap = new Map();
    for(let s of spritesDetectados) {
        let tmpCanvas = document.createElement('canvas'); tmpCanvas.width = s.w; tmpCanvas.height = s.h;
        let tmpCtx = tmpCanvas.getContext('2d'); tmpCtx.drawImage(imgOriginal, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h);
        let hash = tmpCanvas.toDataURL(); 
        if(hashMap.has(hash)) { let master = hashMap.get(hash); duplicatesMap.set(s.name, master); } else { hashMap.set(hash, s); uniqueFrames.push(s); }
    }
    
    let dupCount = spritesDetectados.length - uniqueFrames.length; uniqueFrames.sort((a, b) => b.h - a.h); let totalArea = 0; let maxW = 0;
    for(let s of uniqueFrames) { totalArea += (s.w * s.h); if(s.w > maxW) maxW = s.w; }
    let idealWidth = Math.ceil(Math.sqrt(totalArea) * 1.15); let maxWidth = Math.max(maxW, idealWidth); 
    let currentX = 0; let currentY = 0; let shelfHeight = 0; let actualMaxWidth = 0;
    for(let s of uniqueFrames) {
        if(currentX + s.w > maxWidth) { currentX = 0; currentY += shelfHeight; shelfHeight = 0; }
        s.packX = currentX; s.packY = currentY; currentX += s.w; if(s.h > shelfHeight) shelfHeight = s.h; if(currentX > actualMaxWidth) actualMaxWidth = currentX;
    }
    let totalHeight = currentY + shelfHeight;
    let packCanvas = document.createElement('canvas'); packCanvas.width = actualMaxWidth; packCanvas.height = totalHeight; let pCtx = packCanvas.getContext('2d');
    for(let s of uniqueFrames) { pCtx.drawImage(imgOriginal, s.x, s.y, s.w, s.h, s.packX, s.packY, s.w, s.h); }
    
    let nombreZipPNG = nombreArchivo.replace(/\.[^/.]+$/, "_optimized.png");

    let xmlLines = [];
    xmlLines.push('<?xml version="1.0" encoding="utf-8"?>');
    xmlLines.push('<TextureAtlas imagePath="' + nombreZipPNG + '">');
    xmlLines.push('<!-- Spritesheet Generator FNF LaloCF -->\t');
    xmlLines.push('<!-- https://lalocf2.github.io/spritesheet-generator-fnf/ -->\t');
    
    let exportSprites = [...spritesDetectados]; exportSprites.sort((a, b) => a.name.localeCompare(b.name));
    exportSprites.forEach((s) => {
        let target = duplicatesMap.has(s.name) ? duplicatesMap.get(s.name) : s; let rot = (s.angle === 90 || s.angle === 270) ? ' rotated="true"' : '';
        xmlLines.push('\t<SubTexture name="' + s.name + '" x="' + target.packX + '" y="' + target.packY + '" width="' + target.w + '" height="' + target.h + '" frameX="' + s.frameX + '" frameY="' + s.frameY + '" frameWidth="' + s.frameWidth + '" frameHeight="' + s.frameHeight + '"' + rot + '/>');
    }); 
    xmlLines.push('</TextureAtlas>');

    let xml = xmlLines.join('\\r\\n').replace(/\\\\r\\\\n/g, '\\r\\n'); // Fix safety parse
    xml = xmlLines.join('\r\n');
    
    packCanvas.toBlob(function(blobPNG) { 
        let zip = new JSZip();
        zip.file(nombreZipPNG, blobPNG);
        zip.file(nombreArchivo.replace(/\.[^/.]+$/, "_optimized.xml"), xml);
        zip.generateAsync({type:"blob"}).then(function(content) {
            let aZip = document.createElement('a'); aZip.href = URL.createObjectURL(content);
            aZip.download = nombreArchivo.replace(/\.[^/.]+$/, "_optimized.zip"); aZip.click();
            document.getElementById('iaLoader').style.display = 'none';
            alert(`¡Éxito! Imagen comprimida.\nSe eliminaron ${dupCount} frames duplicados.\nTu archivo ZIP se ha descargado.`);
        });
    });
}

function exportarActual() {
    if(appMode === 'PSYCH') {
        let charData = { animations: psychAnimations, no_antialiasing: !document.getElementById('p_antialias').checked, image: document.getElementById('p_image').value, position: [parseInt(document.getElementById('p_posX').value)||0, parseInt(document.getElementById('p_posY').value)||0], healthicon: document.getElementById('p_icon').value, flip_x: document.getElementById('p_flip').checked, healthbar_colors: hexToRgb(document.getElementById('p_color').value), camera_position: [parseInt(document.getElementById('p_camX').value)||0, parseInt(document.getElementById('p_camY').value)||0], sing_duration: parseFloat(document.getElementById('p_sing').value)||4, scale: parseFloat(document.getElementById('p_scale').value)||1 };
        const blob = new Blob([JSON.stringify(charData, null, "\t")], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = nombreArchivo.replace(/\.[^/.]+$/, ".json"); document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } else {
        if (spritesDetectados.length === 0) return alert("❌ No hay frames para exportar.");

        let xmlLines = [];
        xmlLines.push('<?xml version="1.0" encoding="utf-8"?>');
        xmlLines.push('<TextureAtlas imagePath="' + nombreArchivo + '">');
        xmlLines.push('<!-- Spritesheet Generator FNF LaloCF -->\t');
        xmlLines.push('<!-- https://lalocf2.github.io/spritesheet-generator-fnf/ -->\t');
        
        let exportSprites = [...spritesDetectados]; exportSprites.sort((a, b) => a.name.localeCompare(b.name));
        exportSprites.forEach((s) => { 
            let rot = (s.angle === 90 || s.angle === 270) ? ' rotated="true"' : ''; 
            xmlLines.push('\t<SubTexture name="' + s.name + '" x="' + s.x + '" y="' + s.y + '" width="' + s.w + '" height="' + s.h + '" frameX="' + s.frameX + '" frameY="' + s.frameY + '" frameWidth="' + s.frameWidth + '" frameHeight="' + s.frameHeight + '"' + rot + '/>'); 
        });
        xmlLines.push('</TextureAtlas>');
        
        let xml = xmlLines.join('\r\n');
        
        const blob = new Blob([xml], { type: 'text/xml' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        let baseName = nombreArchivo.replace(/\.[^/.]+$/, ""); a.download = baseName + ".xml"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
}
