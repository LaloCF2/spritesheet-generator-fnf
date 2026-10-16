const CHANGELOG_DATA = [
    {
        version: "1.5.2",
        date: "Reciente",
        changes: [
            "<b><span style='color: #00ff88;'>[NUEVO] Botones de Importación Interactivos (Verde / Rojo):</span></b> Al importar cualquier archivo válido (.PNG, .XML, .JSON, Audio), los botones se iluminan en color verde para confirmar la carga exitosa.",
            "<b><span style='color: #00e5ff;'>[MEJORA] Integración Global:</span></b> Activado en Optimizador, Escáner de Cero, Compresor PNG, Compresor de Audio OGG, Conversor Atlas y Creador de GIF.",
            "<b><span style='color: #b57cff;'>[MEJORA] (Optimizador) Selector de JSON Rediseñado:</span></b> Botón interactivo tipo píldora para importar .JSON en Optimizador y Escáner de Cero.",
            "<b><span style='color: #00ff88;'>[CORRECCIÓN] Renderizado Limpio de Rueda de Carga:</span></b> Se eliminó la visualización de etiquetas HTML sin procesar (como &lt;br&gt; y &lt;span&gt;). Ahora todos los avisos de exportación, compresión y optimización se formatean limpiamente."
        ]
    },
    {
        version: "1.5.1",
        changes: [
            "<b><span style='color: #00e5ff;'>[MEJORA] (Optimizador) Alineación de Posición y Cámara Psych Engine:</span></b> Cálculo matemático automático de posición [X, Y], cámara [X, Y] y escala en el .JSON. Evita desfasar o que el personaje flote en el escenario y mantiene el enfoque de la cámara perfecto.",
            "<b><span style='color: #aaff00;'>[MEJORA] (Optimizador) Rueda de Carga:</span></b> Proceso guiado con fases matemáticas detalladas y confirmación interactiva en el badge del JSON importado.",
            "<b><span style='color: #ffaa00;'>[MEJORA] (Optimizador) Arquitectura:</span></b> Separación de herramientas en múltiples páginas para una carga drásticamente más rápida en móviles.",
            "<b><span style='color: #00ff88;'>[MEJORA] (Generador GIF Animado) Sincronización Musical BPM:</span></b> Mejora el ajuste de delays por frame en centisegundos para que los GIFs encajen perfectamente con cualquier canción sin repetir frames innecesariamente.",
            "<b><span style='color: #00e5ff;'>[NUEVO] (Generador GIF Animado) Control de Fondo para GIFs:</span></b> Opción de fondo transparente o fondo de color sólido con paleta interactiva y selector personalizado.",
            "<b><span style='color: #00ff88;'>[MEJORA] (Generador GIF Animado) Sistema de recortes:</span></b> Mejoras al realizar cajas o recortes para mejor facilidad.",
            "<b><span style='color: #aaa;'>[CORRECCIÓN]</span></b> Corrección de errores y mejoras de visualización."
        ]
    },
    {
        version: "1.5.0",
        changes: [
            "<b><span style='color: #00e5ff;'>[NUEVO]</span> Generador de GIF Animado:</b> Crea GIFs a partir de archivos sueltos, spritesheets solos, o combinaciones de XML+PNG sincronizados a los BPM de Friday Night Funkin'.",
            "<b><span style='color: #4caf50;'>[MEJORA]</span> Autoguardado:</b> Sistema de guardado automático en caché periódico y al minimizar la aplicación para evitar pérdida de progreso.",
            "<b><span style='color: #b57cff;'>[NUEVO]</span> Política de Privacidad:</b> Claridad total sobre el procesamiento 100% local sin servidores."
        ]
    },
    {
        version: "1.4.3",
        changes: ["<b><span style='color: #aaa;'>[CORRECCIÓN]</span></b> Corrección de errores y mejoras de rendimiento."]
    },
    {
        version: "1.4.2",
        changes: ["<b><span style='color: #aaa;'>[CORRECCIÓN]</span></b> Corrección de errores y optimización de memoria."]
    },
    {
        version: "1.4.1",
        changes: ["<b><span style='color: #aaa;'>[CORRECCIÓN]</span></b> Corrección de errores en la carga de archivos."]
    },
    {
        version: "1.4.0",
        changes: [
            "<b><span style='color: #ffaa00;'>[NUEVO]</span> Conversor Animate Atlas:</b> Importación de archivos .json y su imagen .png para optimizarlos.",
            "<b><span style='color: #b57cff;'>[MEJORA]</span> Optimizador:</b> Edita la escala y reduce la resolución conservando el peso bajo.",
            "<b><span style='color: #ff3366;'>[NUEVO]</span> Compresor Audio OGG:</b> Reduce el tamaño de instrumentales y voces al instante."
        ]
    },
    {
        version: "1.3.0",
        changes: [
            "<b><span style='color: #ffaa00;'>[NUEVO]</span> Psych Live Editor:</b> Interfaz beta para alinear animaciones en tiempo real para Psych Engine.",
            "<b><span style='color: #aaa;'>[MEJORA]</span></b> Corrección de errores y mejoras en la interfaz de usuario."
        ]
    },
    {
        version: "1.2.0",
        changes: ["<b><span style='color: #aaa;'>[MEJORA]</span></b> Corrección de errores y mejoras de estabilidad."]
    },
    {
        version: "1.1.0",
        changes: ["<b><span style='color: #aaa;'>[MEJORA]</span></b> Corrección de errores y soporte inicial para exportar archivos individuales."]
    },
    {
        version: "1.0.0",
        changes: ["<b><span style='color: #4caf50;'>[LANZAMIENTO]</span></b> Lanzamiento de Spritesheet Generator FNF con Escáner y Optimizador XML."]
    }
];
