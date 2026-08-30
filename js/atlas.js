// ==========================================
// ANIMATE ATLAS BAKER A SPARROW V2
// ==========================================

var atlasAnimObj = null;
var atlasJsonObj = null;
var atlasPngImg = null;
var atlasPngFileName = "";
var animSpritesDict = {};

function handleAtlasFileDrop(file) {
    if (appMode === 'ATLAS') {
        const dt = new DataTransfer(); dt.items.add(file);
        let reader = new FileReader();
        reader.onload = function (e) {
            try {
                let json = JSON.parse(e.target.result);
                if (json.AN || json.ANIMATION) {
                    document.getElementById('atlasAnimUpload').files = dt.files;
                    document.getElementById('atlasAnimUpload').dispatchEvent(new Event('change'));
                } else if (json.ATLAS || json.frames) {
                    document.getElementById('atlasJsonUpload').files = dt.files;
                    document.getElementById('atlasJsonUpload').dispatchEvent(new Event('change'));
                }
            } catch (e) { }
        };
        reader.readAsText(file);
    }
}

document.getElementById('atlasAnimUpload').addEventListener('change', (e) => {
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function (event) {
        try {
            atlasAnimObj = JSON.parse(event.target.result);
            updateAtlasPreview();
        } catch (err) { alert("Error: Animation JSON inválido."); }
    };
    reader.readAsText(file);
});

document.getElementById('atlasJsonUpload').addEventListener('change', (e) => {
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function (event) {
        try {
            atlasJsonObj = JSON.parse(event.target.result);
            animSpritesDict = {};
            if (atlasJsonObj.ATLAS && atlasJsonObj.ATLAS.SPRITES) {
                atlasJsonObj.ATLAS.SPRITES.forEach(s => { animSpritesDict[s.SPRITE.name] = s.SPRITE; });
            } else if (atlasJsonObj.frames) {
                for (let k in atlasJsonObj.frames) {
                    let f = atlasJsonObj.frames[k].frame;
                    animSpritesDict[k] = { name: k, x: f.x, y: f.y, w: f.w, h: f.h, rotated: atlasJsonObj.frames[k].rotated };
                }
            }
            updateAtlasPreview();
        } catch (err) { alert("Error: Spritemap JSON inválido."); }
    };
    reader.readAsText(file);
});

document.getElementById('atlasPngUpload').addEventListener('change', (e) => {
    let file = e.target.files[0];
    if (!file) return;
    atlasPngFileName = file.name;
    let reader = new FileReader();
    reader.onload = function (event) {
        atlasPngImg = new Image();
        atlasPngImg.onload = updateAtlasPreview;
        atlasPngImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

let atlasGlobalAnimations = [];

function updateAtlasPreview() {
    let box = document.getElementById('atlasPreviewBox');
    if (atlasAnimObj && atlasJsonObj && atlasPngImg) {
        let anims = [];
        atlasGlobalAnimations = [];
        if (atlasAnimObj.AN && atlasAnimObj.AN.TL && atlasAnimObj.AN.TL.L) {
            let layers = Array.isArray(atlasAnimObj.AN.TL.L) ? atlasAnimObj.AN.TL.L : [atlasAnimObj.AN.TL.L];
            layers.forEach(l => {
                let frames = Array.isArray(l.FR) ? l.FR : [l.FR];
                frames.forEach(fr => {
                    if (fr.N && !anims.includes(fr.N)) {
                        anims.push(fr.N);
                        atlasGlobalAnimations.push({ name: fr.N, start: fr.I || 0, end: (fr.I || 0) + (fr.DU || 1), layer: l });
                    }
                });
            });
        }

        let sel = document.getElementById('atlasAnimSelect');
        sel.innerHTML = '';
        atlasGlobalAnimations.forEach(a => {
            let opt = document.createElement('option');
            opt.value = a.name; opt.textContent = a.name;
            sel.appendChild(opt);
        });

        let canvas = document.getElementById('atlasPreviewCanvas');
        canvas.style.display = 'block';
        let span = box.querySelector('span');
        if (span) span.style.display = 'none';

        document.getElementById('btnRunAtlas').style.display = 'block';

        updateAtlasPreviewCanvas();
    } else {
        let span = box.querySelector('span');
        if (span) span.style.display = 'block';
        document.getElementById('atlasPreviewCanvas').style.display = 'none';
        document.getElementById('btnRunAtlas').style.display = 'none';
    }
    if (typeof window.autoSaveHistory === 'function') window.autoSaveHistory();
}

function updateAtlasPreviewCanvas() {
    let selName = document.getElementById('atlasAnimSelect').value;
    if (!selName) return;

    let anim = atlasGlobalAnimations.find(a => a.name === selName);
    if (!anim) return;

    let canvas = document.getElementById('atlasPreviewCanvas');
    canvas.width = 1000; canvas.height = 1000;
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2);

    renderSymbolTimeline(atlasAnimObj.AN.TL, anim.start, ctx);
}

async function ejecutarAtlasBaker() {
    if (!atlasAnimObj || !atlasJsonObj || !atlasPngImg) return alert("Faltan archivos.");

    let optPng = document.getElementById('chkAtlasPng').checked;
    let optOpt = document.getElementById('chkAtlasOpt').checked;
    let optXml = document.getElementById('chkAtlasXml').checked;
    let optJson = document.getElementById('chkAtlasJson').checked;

    if (!optPng && !optXml && !optJson) return alert("Selecciona al menos una opción para exportar.");

    showLoader("ORDENANDO", "Generando fotogramas... 0%");


    let animations = [];
    let layers = Array.isArray(atlasAnimObj.AN.TL.L) ? atlasAnimObj.AN.TL.L : [atlasAnimObj.AN.TL.L];
    layers.forEach(l => {
        let frames = Array.isArray(l.FR) ? l.FR : [l.FR];
        frames.forEach(fr => {
            if (fr.N) {
                animations.push({ name: fr.N, start: fr.I || 0, end: (fr.I || 0) + (fr.DU || 1), layer: l });
            }
        });
    });

    if (animations.length === 0) return alert("No se encontraron animaciones (N) en la línea de tiempo principal.");

    let framesRendered = [];
    let scaleMultiplier = 1;

    let offCtx = document.createElement('canvas').getContext('2d');

    for (let a = 0; a < animations.length; a++) {
        let anim = animations[a];
        let frameCount = anim.end - anim.start;
        for (let f = 0; f < frameCount; f++) {
            let actualFrame = anim.start + f;

            let minX = 2000, minY = 2000, maxX = -1, maxY = -1;

            let tempCanv = document.createElement('canvas');
            tempCanv.width = 2000; tempCanv.height = 2000;
            let tCtx = tempCanv.getContext('2d', { willReadFrequently: true });
            tCtx.translate(1000, 1000);

            renderSymbolTimeline(atlasAnimObj.AN.TL, actualFrame, tCtx);

            let idata = tCtx.getImageData(0, 0, 2000, 2000);
            let d32 = new Uint32Array(idata.data.buffer);

            for (let y = 0; y < 2000; y++) {
                for (let x = 0; x < 2000; x++) {
                    if ((d32[y * 2000 + x] & 0xFF000000) !== 0) { minY = y; break; }
                }
                if (minY !== 2000) break;
            }

            if (minY !== 2000) {
                for (let y = 1999; y >= minY; y--) {
                    for (let x = 0; x < 2000; x++) {
                        if ((d32[y * 2000 + x] & 0xFF000000) !== 0) { maxY = y; break; }
                    }
                    if (maxY !== -1) break;
                }
                for (let x = 0; x < 2000; x++) {
                    for (let y = minY; y <= maxY; y++) {
                        if ((d32[y * 2000 + x] & 0xFF000000) !== 0) { minX = x; break; }
                    }
                    if (minX !== 2000) break;
                }
                for (let x = 1999; x >= minX; x--) {
                    for (let y = minY; y <= maxY; y++) {
                        if ((d32[y * 2000 + x] & 0xFF000000) !== 0) { maxX = x; break; }
                    }
                    if (maxX !== -1) break;
                }
            }

            if (minX <= maxX) {
                let w = maxX - minX + 1;
                let h = maxY - minY + 1;
                let finalCanv = document.createElement('canvas');
                finalCanv.width = w; finalCanv.height = h;
                finalCanv.getContext('2d').putImageData(tCtx.getImageData(minX, minY, w, h), 0, 0);

                framesRendered.push({
                    animName: anim.name,
                    frameNum: f,
                    canvas: finalCanv,
                    w: w, h: h,
                    frameX: -(minX - 1000),
                    frameY: -(minY - 1000)
                });
            }

            document.getElementById('iaStatusTxt').innerHTML = `Renderizando ${anim.name} (${f + 1}/${frameCount})...`;
            await pensar(1);
        }
    }

    showLoader("EMPAQUETANDO SPRITES", "Generando Spritesheet Sparrow...");
    await pensar(50);

    framesRendered.sort((a, b) => b.h - a.h);
    let packerWidth = 4096;
    let currentX = 0; let currentY = 0; let rowHeight = 0;

    framesRendered.forEach(fr => {
        if (currentX + fr.w > packerWidth) {
            currentX = 0;
            currentY += rowHeight;
            rowHeight = 0;
        }
        fr.x = currentX;
        fr.y = currentY;
        currentX += fr.w + 2;
        if (fr.h > rowHeight) rowHeight = fr.h + 2;
    });

    let packerHeight = currentY + rowHeight;
    let finalAtlas = document.createElement('canvas');
    finalAtlas.width = packerWidth; finalAtlas.height = packerHeight;
    let finalCtx = finalAtlas.getContext('2d');

    let baseName = document.getElementById('txtAtlasExportName').value.trim() || atlasPngFileName.replace('.png', '');
    let finalPngName = baseName + '.png';

    let xml = '<?xml version="1.0" encoding="utf-8"?>\n<TextureAtlas imagePath="\n<!-- Spritesheet Generator FNF LaloCF -->\t\n<!-- https://lalocf2.github.io/spritesheet-generator-fnf/ -->\t' + finalPngName + '">\n';
    let psychJson = { animations: [], image: baseName, position: [0, 0], healthicon: "face", flip_x: false, healthbar_colors: [161, 161, 161], camera_position: [0, 0], sing_duration: 4, scale: 1 };

    let psychAnimsAdded = {};

    framesRendered.forEach(fr => {
        finalCtx.drawImage(fr.canvas, fr.x, fr.y);
        let frameName = fr.animName + fr.frameNum.toString().padStart(4, '0');
        xml += `\t<SubTexture name="${frameName}" x="${fr.x}" y="${fr.y}" width="${fr.w}" height="${fr.h}" frameX="${fr.frameX}" frameY="${fr.frameY}" frameWidth="${fr.w}" frameHeight="${fr.h}"/>\n`;

        if (!psychAnimsAdded[fr.animName]) {
            psychAnimsAdded[fr.animName] = true;
            psychJson.animations.push({ anim: fr.animName, name: fr.animName, fps: 24, loop: false, indices: [], offsets: [0, 0] });
        }
    });

    xml += '</TextureAtlas>';

    showLoader("GENERANDO ZIP", optOpt ? "Comprimiendo PNG con UPNG..." : "Preparando archivo...");
    await pensar(50);

    let zip = new JSZip();

    if (optXml) zip.file(baseName + ".xml", xml);
    if (optJson) zip.file(baseName + ".json", JSON.stringify(psychJson, null, 2));

    let pngBlob = null;
    if (optPng || optOpt) {
        if (optOpt) {
            let rgba = finalCtx.getImageData(0, 0, packerWidth, packerHeight).data;
            let upng = UPNG.encode([rgba.buffer], packerWidth, packerHeight, 256);
            pngBlob = new Blob([upng], { type: 'image/png' });
        } else {
            pngBlob = await new Promise(res => finalAtlas.toBlob(res, 'image/png'));
        }
        zip.file(finalPngName, pngBlob);
    }

    let content = await zip.generateAsync({ type: "blob" });
    let url = URL.createObjectURL(content);
    let a = document.createElement("a");
    a.href = url;
    a.download = baseName + "_Baked.zip";
    a.click();

    ocultarCargaGlobal();
    let box = document.getElementById('atlasPreviewBox');
    box.innerHTML = `
        <div style="font-size:2rem; font-weight:bold; color:var(--accent-gold);">¡GENERADO!</div>
        <div style="color:#aaa; font-size:0.8rem; margin-top:5px;">Descarga completa.</div>
    `;
}

function renderSymbolTimeline(tl, frameIndex, ctx) {
    if (!tl || !tl.L) return;
    let layers = Array.isArray(tl.L) ? tl.L : [tl.L];
    for (let i = layers.length - 1; i >= 0; i--) {
        let layer = layers[i];
        let frames = Array.isArray(layer.FR) ? layer.FR : [layer.FR];
        let kf = frames.find(fr => frameIndex >= (fr.I || 0) && frameIndex < (fr.I || 0) + (fr.DU || 1));

        if (kf && kf.E) {
            let elements = Array.isArray(kf.E) ? kf.E : [kf.E];
            elements.forEach(el => {
                if (el.SI) {
                    let si = el.SI;
                    let m = si.M3D;
                    ctx.save();
                    if (m) ctx.transform(m[0], m[1], m[4], m[5], m[12], m[13]);
                    if (si.C && si.C.AL !== undefined) ctx.globalAlpha *= si.C.AL;

                    let innerFrame = frameIndex - (kf.I || 0) + (si.FF || 0);
                    let symbolDef = atlasAnimObj.SD.S.find(s => s.SN === si.SN);
                    if (symbolDef && symbolDef.TL) {
                        let dur = getSymbolDuration(symbolDef.TL);
                        if (si.LP === 'LP') innerFrame = innerFrame % dur;
                        renderSymbolTimeline(symbolDef.TL, innerFrame, ctx);
                    }
                    ctx.restore();
                } else if (el.ASI) {
                    let asi = el.ASI;
                    let m = asi.M3D;
                    ctx.save();
                    if (m) ctx.transform(m[0], m[1], m[4], m[5], m[12], m[13]);

                    let sprite = animSpritesDict[asi.N];
                    if (sprite) {
                        if (sprite.rotated) {
                            ctx.translate(sprite.w / 2, sprite.h / 2);
                            ctx.rotate(-Math.PI / 2);
                            ctx.drawImage(atlasPngImg, sprite.x, sprite.y, sprite.h, sprite.w, -sprite.h / 2, -sprite.w / 2, sprite.h, sprite.w);
                        } else {
                            ctx.drawImage(atlasPngImg, sprite.x, sprite.y, sprite.w, sprite.h, 0, 0, sprite.w, sprite.h);
                        }
                    }
                    ctx.restore();
                }
            });
        }
    }
}

function getSymbolDuration(tl) {
    let dur = 1;
    let layers = Array.isArray(tl.L) ? tl.L : [tl.L];
    layers.forEach(l => {
        let frames = Array.isArray(l.FR) ? l.FR : [l.FR];
        let lastFr = frames[frames.length - 1];
        if (lastFr) { let end = (lastFr.I || 0) + (lastFr.DU || 1); if (end > dur) dur = end; }
    });
    return dur;
}
