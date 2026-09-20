// ==========================================
// OPTIMIZADOR PESO PNG
// ==========================================

let compNombreArchivo = "sprite_optimizado.png";
let compOriginalSize = 0;

document.getElementById('imgCompresorUpload')?.addEventListener('change', (e) => {
    let file = e.target.files[0];
    if(!file) return;
    
    compNombreArchivo = file.name;
    compOriginalSize = file.size;
    
    showLoader("CARGANDO...", "Leyendo imagen...");
    
    let reader = new FileReader();
    reader.onload = (ev) => {
        let img = new Image();
        img.onload = () => {
            let cvs = document.getElementById('canvasCompresorPreview');
            cvs.width = img.width; 
            cvs.height = img.height;
            let cCtx = cvs.getContext('2d');
            cCtx.drawImage(img, 0, 0);

            document.getElementById('txtCompOrigSize').textContent = (compOriginalSize / 1024 / 1024).toFixed(2) + " MB";
            document.getElementById('txtCompNewSize').textContent = "---";
  
            document.getElementById('btnDownloadComp').style.display = 'none';
            document.getElementById('btnRunCompressor').style.display = 'block';
            
            ocultarCargaGlobal();
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

async function ejecutarCompresion() {
    let numColors = parseInt(document.getElementById('sliderCompColors').value) || 256;
    
    showLoader("COMPRIMIENDO PNG", `Cuantizando a ${numColors} colores.<br><br><span style="color:#ffcc00; font-size:0.8rem;">El proceso corre en segundo plano y no trabará tu dispositivo. Puede tomar de 15 a 60 segundos dependiendo del peso. ¡No cierres la página!</span>`);
    
    await pensar(500); 
    
    setTimeout(async () => {
        try {
            let cvs = document.getElementById('canvasCompresorPreview');
            let cCtx = cvs.getContext('2d');
            let w = cvs.width; 
            let h = cvs.height;

            let imgData = cCtx.getImageData(0, 0, w, h);
  
            let pakoText = await (await fetch('https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js')).text();
            let upngText = await (await fetch('https://cdn.jsdelivr.net/npm/upng-js@2.1.0/UPNG.min.js')).text();

            let workerCode = `
                ${pakoText}
                ${upngText}
                
                self.onmessage = function(e) {
                    try {
                        let d = e.data;
                        let pngData = UPNG.encode([d.buffer], d.w, d.h, d.colors);
                        self.postMessage({ success: true, data: pngData }, [pngData]);
                    } catch(err) {
                        self.postMessage({ success: false, error: err.message || err.toString() });
                    }
                };
            `;
            let workerBlob = new Blob([workerCode], { type: 'application/javascript' });
            let worker = new Worker(URL.createObjectURL(workerBlob));
            
            worker.onmessage = function(e) {
                if(e.data.success) {
                    let pngData = e.data.data;
                    let blob = new Blob([pngData], { type: 'image/png' });

                    let finalMB = (blob.size / 1024 / 1024).toFixed(2);
                    let finalKB = (blob.size / 1024).toFixed(2);
                    
                    if(blob.size < 1024 * 1024) {
                        document.getElementById('txtCompNewSize').textContent = finalKB + " KB";
                    } else {
                        document.getElementById('txtCompNewSize').textContent = finalMB + " MB";
                    }
                  
                    let url = URL.createObjectURL(blob);
                    let btnDown = document.getElementById('btnDownloadComp');
                    
                    btnDown.onclick = () => {
                        let a = document.createElement('a'); 
                        a.href = url;
                        a.download = compNombreArchivo.replace(/\.[^/.]+$/, "_compressed.png");
                        a.click();
                    };
                    
                    btnDown.style.display = 'block';
                    ocultarCargaGlobal();
                    worker.terminate();
                } else {
                    ocultarCargaGlobal();
                    alert("❌ Hubo un error al comprimir en segundo plano: " + e.data.error);
                    worker.terminate();
                }
            };

            worker.onerror = function(err) {
                ocultarCargaGlobal();
                alert("❌ Ocurrió un error crítico en el proceso de compresión. Reinicia la página.");
                console.error(err);
                worker.terminate();
            };

            worker.postMessage({ buffer: imgData.data.buffer, w: w, h: h, colors: numColors }, [imgData.data.buffer]);
            
        } catch(e) {
            ocultarCargaGlobal();
            alert("❌ Hubo un error al leer la imagen. Puede que sea demasiado grande para la memoria del navegador.");
            console.error(e);
        }
    }, 100);
}
