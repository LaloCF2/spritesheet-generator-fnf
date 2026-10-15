# Spritesheet Generator FNF - Historial de Versiones

## Versión 1.5.1 (Actual)
- **[MEJORA] Optimizador (Alineación Automática Psych Engine):** Cálculo matemático automático de posición y escala al optimizar la resolución de texturas y XML junto al archivo `.json` del personaje. Se compensa exactamente la contracción del centro de transformación HaxeFlixel (ΔX, ΔY), asegurando que el personaje conserve su posición original en el escenario sin flotar ni desfasarse.
- **[MEJORA] Proceso con Rueda de Carga:** Animación de carga y fases matemáticas detalladas durante la optimización, con confirmación visual interactiva en el badge del JSON importado.
- **[MEJORA] Arquitectura:** Separación de herramientas en múltiples archivos HTML para carga más rápida y mejor rendimiento en dispositivos móviles.
- **[MEJORA] Sincronización Musical BPM:** Mejora el ajuste de delays por frame en centisegundos para que los GIFs encajen perfectamente con cualquier canción sin repetir frames innecesariamente.
- **[NUEVO] Control de Fondo para GIFs:** Opción para exportar y previsualizar GIFs con fondo transparente o con color sólido, incluyendo paleta de colores rápidos (negro, blanco, croma verde, croma azul, magenta, etc.) y selector de color personalizado.
- **[MEJORA] Sistema de recortes:** Mejoras al realizar cajas o recortes para mejor facilidad.
- **[CORRECCION]** Corrección de errores y mejoras generales de rendimiento.

## Versión 1.5.0
- **[NUEVO] Generador de GIF Animado:** Crea GIFs a partir de archivos sueltos, spritesheets solos, o combinaciones de XML+PNG sincronizados a los BPM de Friday Night Funkin'.
- **[MEJORA] Autoguardado:** Sistema de guardado automático en caché periódico y al minimizar la aplicación para evitar pérdida de progreso.
- **[MEJORA] Arquitectura:** Separación de herramientas en múltiples archivos HTML para carga más rápida y mejor rendimiento en dispositivos móviles.
- **[MEJORA] Sincronización Musical BPM Precisa:** Eliminado el redondeo forzado a FPS enteros que provocaba velocidades idénticas en BPMs cercanos (105 vs 106). Nuevo motor de tiempo musical continuo basado en milisegundos exactos de beat (60,000 / BPM), selector de compás (1 Beat, 2 Beats, 4 Beats, 1/2 Beat, 1 Step por frame), pulso LED visual, claqueta/metrónomo auditivo opcional y ajuste de centisegundos en el GIF exportado para sincronización perfecta con cualquier canción.
- **[NUEVO] Política de Privacidad:** Se añadió una sección de política de privacidad clara al pie de la página principal.

## Versión 1.4.3
- **[CORRECCIÓN]** Corrección de errores y mejoras generales de rendimiento.

## Versión 1.4.2
- **[CORRECCIÓN]** Corrección de errores y optimización de memoria.

## Versión 1.4.1
- **[CORRECCIÓN]** Corrección de errores en la carga de archivos.

## Versión 1.4.0
- **[NUEVO] Conversor Animate Atlas:** Importación de archivos .json con su imagen .png para optimizarlos y reducir su resolución de imagen.
- **[MEJORA] Optimizador:** Ahora además de modificar la escala del personaje, puedes modificar y optimizar la resolución de la imagen .png para reducir su peso drásticamente.
- **[NUEVO] Compresor Audio OGG:** Herramienta añadida para comprimir archivos de audio.

## Versión 1.3.0
- **[NUEVO] Psych Live Editor:** Modo de previsualización en vivo para ajustar offsets visualmente.
- **[MEJORA]** Corrección de errores y mejoras generales en la interfaz de usuario.

## Versión 1.2.0
- **[MEJORA]** Corrección de errores y mejoras.

## Versión 1.1.0
- **[MEJORA]** Corrección de errores y soporte inicial para exportar archivos individuales.

## Versión 1.0.0
- **[LANZAMIENTO]** Lanzamiento inicial de Spritesheet Generator FNF con funciones básicas de escaneo y optimización de XML.
