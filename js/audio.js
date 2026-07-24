// ==========================================
// COMPRESOR DE AUDIO OGG (VÍA FFMPEG.WASM)
// ==========================================

let oggFileOriginal = null;
let oggFileName = "audio.ogg";
let oggOriginalSize = 0;

document.getElementById('audioUpload').addEventListener('change', (e) => {
    let file = e.target.files[0];
    if(!file) return;
    
    oggFileOriginal = file;
    oggFileName = file.name;
    oggOriginalSize = file.size;

    document.getElementById('txtAudioOrigSize').textContent = (oggOriginalSize / 1024 / 1024).toFixed(2) + " MB";
    document.getElementById('txtAudioNewSize').textContent = "---";
    document.getElementById('txtAudioBPM').textContent = "Calculando...";
    
    document.getElementById('btnDownloadAudio').style.display = 'none';
    document.getElementById('btnRunAudio').style.display = 'block';
    
    detectBPM(file);
});

function detectBPM(file) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const reader = new FileReader();
    reader.onload = function(e) {
        audioCtx.decodeAudioData(e.target.result, function(buffer) {
            const data = buffer.getChannelData(0);
            let peaks = [];
            let threshold = 0.8;
            let step = Math.round(buffer.sampleRate * 0.05); // 50ms step
            
            // Find peaks
            for (let i = 0; i < data.length; i += step) {
                if (data[i] > threshold) {
                    peaks.push(i / buffer.sampleRate);
                }
            }
            
            if (peaks.length < 2) {
                document.getElementById('txtAudioBPM').textContent = "---";
                return;
            }
            
            // Calculate intervals
            let intervals = {};
            for (let i = 1; i < peaks.length; i++) {
                let interval = Math.round((peaks[i] - peaks[i - 1]) * 100) / 100;
                if (interval > 0.2 && interval < 2.0) { // 30 to 300 BPM roughly
                    intervals[interval] = (intervals[interval] || 0) + 1;
                }
            }
            
            // Find most common interval
            let mostCommon = null;
            let maxCount = 0;
            for (let k in intervals) {
                if (intervals[k] > maxCount) {
                    maxCount = intervals[k];
                    mostCommon = parseFloat(k);
                }
            }
            
            if (mostCommon) {
                let bpm = Math.round(60 / mostCommon);
                document.getElementById('txtAudioBPM').textContent = bpm;
            } else {
                document.getElementById('txtAudioBPM').textContent = "???";
            }
        }, function(e){
            document.getElementById('txtAudioBPM').textContent = "Error";
        });
    };
    reader.readAsArrayBuffer(file);
}

async function ejecutarCompresionAudio() {
    if(!oggFileOriginal) return alert("Sube un archivo OGG primero.");
    
    // Obtener la calidad seleccionada por el usuario
    let radios = document.getElementsByName('oggQuality');
    let bitrate = '128k'; // Valor por defecto
    for(let i=0; i<radios.length; i++) {
        if(radios[i].checked) bitrate = radios[i].value;
    }
    
    showLoader("MOTOR DE AUDIO", "Cargando motor FFmpeg en el navegador...<br><br><span style='font-size:0.8rem;color:#ffaa00;'>La primera vez que lo uses puede tardar unos segundos en descargar el motor. ¡No cierres la página!</span>");
    
    try {
        const { FFmpeg } = window.FFmpeg;
        const { fetchFile } = window.FFmpegUtil;
        
        // 1. Instanciar y Cargar FFmpeg solo si no existe
        if(!window.ffmpegInstance) {
            window.ffmpegInstance = new FFmpeg();
            
            // Lector de progreso de audio
            window.ffmpegInstance.on('progress', ({ progress }) => {
                let pct = Math.round(progress * 100);
                if(pct > 0 && pct <= 100) {
                    document.getElementById('iaStatusTxt').innerHTML = `
                        <div style="font-size:0.9rem; color:#aaa; margin-bottom:5px;">Codificando Audio...</div>
                        <div style="font-size:2.5rem; font-weight:900; color:#ffaa00; text-shadow: 0 0 10px rgba(255,170,0,0.5);">${pct}%</div>
                        <div style="font-size:0.8rem; color:#fff; margin-top:5px;">Reduciendo peso.</div>
                    `;
                }
            });

            // Cargar el núcleo single-thread (No requiere configuraciones pesadas de servidor)
            await window.ffmpegInstance.load({
                coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
                wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm'
            });
        }
        
        showLoader("COMPRIMIENDO AUDIO", "Preparando archivo...");
        
        // 2. Escribir el archivo en la memoria de FFmpeg
        await window.ffmpegInstance.writeFile('input.ogg', await fetchFile(oggFileOriginal));
        
        // 3. Ejecutar el comando mágico de compresión Vorbis
        // -i (input) -c:a libvorbis (codec OGG FNF) -b:a (bitrate/calidad) output
        await window.ffmpegInstance.exec(['-i', 'input.ogg', '-c:a', 'libvorbis', '-b:a', bitrate, 'output.ogg']);
        
        // 4. Leer el resultado
        const data = await window.ffmpegInstance.readFile('output.ogg');
        const blob = new Blob([data.buffer], { type: 'audio/ogg' });
        
        // Mostrar tamaño nuevo
        let finalMB = (blob.size / 1024 / 1024).toFixed(2);
        let finalKB = (blob.size / 1024).toFixed(2);
        
        if(blob.size < 1024 * 1024) {
            document.getElementById('txtAudioNewSize').textContent = finalKB + " KB";
        } else {
            document.getElementById('txtAudioNewSize').textContent = finalMB + " MB";
        }
        
        // 5. Generar Descarga
        let url = URL.createObjectURL(blob);
        let btnDown = document.getElementById('btnDownloadAudio');
        btnDown.onclick = () => {
            let a = document.createElement('a'); 
            a.href = url;
            
            // Añadir el sufijo según la calidad elegida para identificarlo
            let sufijo = "_opt";
            if(bitrate === '80k') sufijo = "_equil";
            if(bitrate === '48k') sufijo = "_max";
            
            a.download = oggFileName.replace(/\.[^/.]+$/, sufijo + ".ogg");
            a.click();
        };
        btnDown.style.display = 'block';
        document.getElementById('iaLoader').style.display = 'none';
        
    } catch(e) {
        console.error(e);
        document.getElementById('iaLoader').style.display = 'none';
        alert("❌ Ocurrió un error al procesar el audio. Asegúrate de tener conexión a internet para descargar el motor la primera vez.");
    }
}
