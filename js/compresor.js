// ==========================================
// OPTIMIZADOR PESO PNG
// ==========================================

let compNombreArchivo = "sprite_optimizado.png";
let compOriginalSize = 0;

document.getElementById('imgCompresorUpload').addEventListener('change', (e) => {
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
            
            iaLoader.style.display = 'none';
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

async function ejecutarCompresion() {
    let numColors = parseInt(document.getElementById('sliderCompColors').value) || 256;
    
    showLoader("COMPRIMIENDO PNG", `Cuantizando a ${numColors} colores.<br><br><span style="color:#ffcc00; font-size:0.8rem;">Imágenes de 4000px pueden tardar de 5 a 15 segundos. ¡No cierres la página!</span>`);
    
    await pensar(500); 
    
    setTimeout(() => {
        try {
            let cvs = document.getElementById('canvasCompresorPreview');
            let cCtx = cvs.getContext('2d');
            let w = cvs.width; 
            let h = cvs.height;

            let imgData = cCtx.getImageData(0, 0, w, h);
  
            let pngData = UPNG.encode([imgData.data.buffer], w, h, numColors);
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
            iaLoader.style.display = 'none';
            
        } catch(e) {
            iaLoader.style.display = 'none';
            alert("❌ Hubo un error al comprimir la imagen. Puede que sea demasiado grande para la memoria del navegador. Intenta reiniciar la página.");
            console.error(e);
        }
    }, 100);
}
