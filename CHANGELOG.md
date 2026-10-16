# Spritesheet Generator FNF - Historial de Versiones

## Versión 1.5.2 (Actual)
- **[NUEVO] Feedback Visual y Diagnóstico en Botones de Importación:**
  - **Color Verde al Importar con Éxito:** Al seleccionar un archivo válido (.PNG, .XML, .JSON, Audio), el botón de importación se ilumina en color verde con confirmación visual de carga, igual que en el creador de GIFs.
  - **Cobertura Completa:** Aplicado de forma unificada en el Optimizador, Escáner de Cero, Compresor PNG, Compresor de Audio OGG, Conversor Atlas y Creador de GIF.
  - **Nuevo Botón Interactivo de JSON:** Renovación del campo de importación de `.json` en Optimizador y Escáner con botón estilo píldora sincronizado al sistema de estados.
- **[CORRECCIÓN] Renderizado Limpio en Rueda de Carga:** Se eliminó la visualización de etiquetas HTML crudas (como `<br>` y `<span style=...>`) en los mensajes de la rueda de carga. Ahora todos los títulos, avisos de congelamiento y advertencias se renderizan con saltos de línea reales y colores estéticos en todas las herramientas.

## Versión 1.5.1
- **[MEJORA] (Optimizador) Alineación Automática Psych Engine:** Cálculo matemático automático de posición y escala al optimizar la resolución de texturas y XML junto al archivo `.json` del personaje. Se compensa exactamente la contracción del centro de transformación HaxeFlixel (ΔX, ΔY), asegurando que el personaje conserve su posición original en el escenario sin flotar ni desfasarse.
- **[MEJORA] (Optimizador) Proceso con Rueda de Carga:** Animación de carga y fases matemáticas detalladas durante la optimización, con confirmación visual interactiva en el badge del JSON importado.
- **[MEJORA] (Optimizador) Arquitectura:** Separación de herramientas en múltiples archivos HTML para carga más rápida y mejor rendimiento en dispositivos móviles.
- **[MEJORA] (Generador GIF Animado) Sincronización Musical BPM:** Mejora el ajuste de delays por frame en centisegundos para que los GIFs encajen perfectamente con cualquier canción sin repetir frames innecesariamente.
- **[NUEVO] (Generador GIF Animado) Control de Fondo para GIFs:** Opción para exportar y previsualizar GIFs con fondo transparente o con color sólido, incluyendo paleta de colores rápidos (negro, blanco, verde, azul, magenta, etc.) y selector de color personalizado.
- **[MEJORA] (Generador GIF Animado) Sistema de recortes:** Mejoras al realizar cajas o recortes para mejor facilidad.
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
