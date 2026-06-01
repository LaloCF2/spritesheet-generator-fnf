# 🎬 IA Sprite Studio Director Pro

¡La herramienta definitiva en la web para creadores y optimizadores de mods de **Friday Night Funkin' (FNF)**! Diseñada específicamente para agilizar el flujo de trabajo con spritesheets (Sparrow XML) y configuraciones de personajes para **Psych Engine**. 

Esta aplicación funciona al 100% del lado del cliente (HTML5/JavaScript nativo), lo que significa que es ultra ligera, rápida y completamente segura.

## 🚀 Demo En Vivo
👉 **[¡Prueba IA Sprite Studio aquí!](https://TU_USUARIO.github.io/TU_REPOSITORIO/)** *(Cambia esto por tu enlace de GitHub Pages cuando lo publiques)*

---

## ✨ Características Clave

### 🖼️ 1. Escáner de Cero Inteligente (Anti-Fragmentos)
* **Mapeo IA Puro:** Detecta islas de píxeles automáticamente mediante el canal Alfa.
* **Algoritmo de Fusión Avanzado:** Evita la creación de "mini-contornos" basura dentro de cajas grandes fusionando automáticamente bloques superpuestos o internos.
* **Auto-Encuadre:** Ajuste automático y centrado de cámara según el tamaño del lienzo de forma nativa.

### 📋 2. Secuenciador y Auto-Renumeración Perfecta
* **Reorganización en Tiempo Real:** Al mover o eliminar frames en la línea de tiempo, la herramienta recalcula de forma automática los índices numéricos (`Idle0000`, `Idle0001`, `Idle0002`) de arriba a abajo. ¡Se acabaron los desórdenes visuales y los errores de carga en el juego!
* **Renombrado por Lotes:** Aplica prefijos personalizados a múltiples frames seleccionados de un solo golpe.

### 🛠️ 3. Optimizador Supremo (Desduplicación de Texturas)
* **Comparación Píxel por Píxel:** Analiza el contenido exacto de cada frame. Si detecta imágenes idénticas (como animaciones estáticas repetidas), conserva una sola copia en el PNG para ahorrar peso de forma masiva.
* **Coordenadas Inteligentes:** En el XML final se generan todas las entradas originales que espera el juego, pero apuntando al mismo frame maestro optimizado.
* **Cuadrado Perfecto (Perfect Square Pack):** Organiza los sprites únicos en una cuadrícula cuadrada compacta para mejorar el rendimiento de memoria en dispositivos móviles y PC de bajos recursos.

### 💾 4. Exportación Dual de Flujo de Trabajo
* **Optimizar (PNG + XML):** Procesa la imagen completa, comprime, desduplica y descarga ambos archivos listos para tu mod.
* **Solo Guardar XML:** Si solo quieres ajustar posiciones (Offsets) o nombres rápidamente, descarga el archivo XML actualizado manteniendo intacto tu PNG original sin alterar sus coordenadas base.

### 🧠 5. Psych Live Character Builder
* **Alineación en Vivo:** Modifica offsets, escalas, posiciones de cámara y barra de vida de forma interactiva con una cruz de guía central.
* **Previsualización de Animaciones:** Añade animaciones por prefijos o índices y míralas correr en bucle a los FPS que desees.
* **Generador de JSON:** Exporta el archivo de configuración `.json` nativo y perfectamente formateado para meterlo directo a la carpeta `characters/` de Psych Engine.

---

## 📱 Compatibilidad Móvil Avanzada
El motor gráfico ha sido optimizado con soporte completo para eventos de puntero (`PointerEvents`), permitiendo navegación táctil fluida:
* **Modo Vista:** Mueve el lienzo con 1 dedo y haz zoom de pellizco con 2 dedos.
* **Modo Edición:** Bloquea la cámara para redimensionar, dibujar o seleccionar cajas de colisión con total precisión milimétrica.

---

## 🛠️ Instalación y Uso Local

No requiere de instalaciones complejas, Node.js ni servidores backend. 

1. Clona este repositorio:
   ```bash
   git clone [https://github.com/TU_USUARIO/TU_REPOSITORIO.git](https://github.com/TU_USUARIO/TU_REPOSITORIO.git)
