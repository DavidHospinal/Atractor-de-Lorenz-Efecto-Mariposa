/**
 * CHAOS-VISUALIZATION.JS
 * Controlador principal del visualizador del Atractor de Lorenz
 */

class ChaosVisualization {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Sistemas principales
        this.particleSystem = new ParticleSystem();
        this.animationId = null;
        
        // Estado de la aplicaci贸n
        this.isPlaying = false;
        this.isPaused = false;
        this.showInfo = false;
        this.fullscreen = false;
        
        // Configuraci贸n de renderizado
        this.renderMode = 'high'; // low, medium, high, ultra
        this.backgroundColor = 'rgba(26, 26, 46, 0.1)';
        this.clearMode = 'fade'; // clear, fade, accumulate
        
        // Efectos especiales
        this.effects = {
            bloom: false,
            chromatic: false,
            noise: false,
            distortion: false
        };
        
        // Interacci贸n
        this.mouse = { x: 0, y: 0, isDown: false };
        this.touch = { x: 0, y: 0, isActive: false };
        
        // Inicializar
        this.initialize();
    }

    /**
     * Inicializaci贸n del sistema
     */
    initialize() {
        this.setupCanvas();
        this.setupEventListeners();
        this.particleSystem.initialize(5);
        this.setupUI();
        
        console.log('馃 Atractor de Lorenz inicializado');
    }

    /**
     * Configuraci髇 del canvas
     */
setupCanvas() {
    const isMobile = window.innerWidth <= 767;
    const isTablet = window.innerWidth > 767 && window.innerWidth <= 1023;
    
    let canvasWidth, canvasHeight, scale;
    
    if (isMobile) {
        // M覸IL: Tama駉s que coinciden EXACTAMENTE con responsive.css
        canvasWidth = 340;  // ? Cambiado de 320 a 340
        canvasHeight = 260; // ? Cambiado de 240 a 260
        scale = 4;
        
        // NO configurar estilos inline - dejar que CSS maneje todo
        // this.canvas.style.width = canvasWidth + 'px';  ? COMENTADO
        // this.canvas.style.height = canvasHeight + 'px'; ? COMENTADO
        
    } else if (isTablet) {
        // TABLET: Tama駉s que coinciden con responsive.css
        canvasWidth = 700;  // ? Cambiado de 600 a 700
        canvasHeight = 450; // ? Cambiado de 400 a 450
        scale = 6;
        
        // NO configurar estilos inline
        // this.canvas.style.width = canvasWidth + 'px';  ? COMENTADO
        // this.canvas.style.height = canvasHeight + 'px'; ? COMENTADO
        
    } else {
        // DESKTOP: Mantener tama駉s
        canvasWidth = 1000;
        canvasHeight = 650;
        scale = 8;
        
        // NO configurar estilos inline
        // this.canvas.style.width = canvasWidth + 'px';  ? COMENTADO
        // this.canvas.style.height = canvasHeight + 'px'; ? COMENTADO
    }
    
    // Configurar resoluci髇 interna con DPR optimizado
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    this.canvas.width = canvasWidth * dpr;
    this.canvas.height = canvasHeight * dpr;
    
    // Escalar contexto para alta definici髇
    this.ctx.scale(dpr, dpr);
    
    // CR蚑ICO: Centro exacto del canvas usando los tama駉s CSS
    this.canvasCenter = {
        x: canvasWidth / 2,
        y: canvasHeight / 2
    };
    
    // Configurar sistema de part韈ulas con centro correcto
    if (this.particleSystem) {
        this.particleSystem.scale = scale;
        
        // Forzar centro en el sistema de Lorenz
        if (this.particleSystem.lorenzSystem) {
            this.particleSystem.lorenzSystem.centerX = this.canvasCenter.x;
            this.particleSystem.lorenzSystem.centerY = this.canvasCenter.y;
        }
        
        // Limpiar trails para recentrar
        this.particleSystem.particles.forEach(particle => {
            if (particle.trail) {
                particle.trail = [];
            }
        });
        
        // Configuraciones espec韋icas para m髒il
        if (isMobile) {
            this.particleSystem.lorenzSystem.dt = 0.015; // Velocidad suave
        }
    }
    
    console.log(`?? Canvas: ${canvasWidth}x${canvasHeight}, Centro: (${this.canvasCenter.x}, ${this.canvasCenter.y}), Escala: ${scale}`);
}

    /**
     * Configuraci贸n de event listeners
     */
    setupEventListeners() {
        // Interacci贸n con mouse
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Interacci贸n t谩ctil
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Teclado
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Redimensionamiento
        window.addEventListener('resize', () => this.handleResize());
        
        // Visibilidad de la p谩gina
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    /**
     * Configuraci贸n de la interfaz de usuario
     */
    setupUI() {
        // Botones de control
        this.setupControlButtons();
        
        // Panel de informaci贸n
        this.setupInfoPanel();
        
        // Controles deslizantes
        this.setupSliders();
        
        // Panel de estad铆sticas
        this.setupStatsPanel();
    }

    /**
     * Configuraci贸n de botones de control
     */
setupControlButtons() {
    const playBtn = document.getElementById('playBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedBtn = document.getElementById('speedBtn');
    const infoBtn = document.getElementById('infoBtn');
    const shareBtn = document.getElementById('shareBtn');
    const captureBtn = document.getElementById('captureBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    // Event listeners con prevenci贸n de problemas
    if (playBtn) {
        playBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePlay();
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.reset();
        });
    }
    
    if (speedBtn) {
        speedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleSpeed();
        });
    }
    
    // FIX ESPEC脥FICO PARA BOT脫N INFO
    if (infoBtn) {
        // Remover listeners previos si existen
        infoBtn.removeEventListener('click', this.handleInfoClick);
        
        // Crear funci贸n bound para poder removerla despu茅s
        this.handleInfoClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('馃敇 Bot贸n Info clickeado');
            this.toggleInfo();
        };
        
        // Agregar listener
        infoBtn.addEventListener('click', this.handleInfoClick);
        
        // Touch events adicionales para m贸vil
        infoBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        });
        
        infoBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('馃摫 Touch Info detectado');
            this.toggleInfo();
        });
        
        console.log('鉁� Bot贸n Info configurado correctamente');
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.share();
        });
    }
    
    if (captureBtn) {
        captureBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.captureFrame();
        });
    }
    
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleFullscreen();
        });
    }
}

    /**
     * Configuraci贸n del panel de informaci贸n
     */
    setupInfoPanel() {
        const infoPanel = document.getElementById('infoPanel');
        if (infoPanel) {
            this.updateInfoPanel();
        }
    }

    /**
     * Configuraci贸n de controles deslizantes
     */
    setupSliders() {
        // Implementar sliders para par谩metros de Lorenz
        const sliders = ['sigma', 'rho', 'beta', 'scale', 'speed'];
        
        sliders.forEach(param => {
            const slider = document.getElementById(`${param}Slider`);
            if (slider) {
                slider.addEventListener('input', (e) => this.updateParameter(param, e.target.value));
            }
        });
    }

    /**
     * Configuraci贸n del panel de estad铆sticas
     */
    setupStatsPanel() {
        this.statsPanel = document.getElementById('statsPanel');
        if (this.statsPanel) {
            this.updateStatsPanel();
        }
    }

    /**
     * Bucle principal de animaci贸n
     */
animate() {
    if (this.isPaused) return;
    
    // Limpiar canvas seg煤n el modo
    this.clearCanvas();
    
    // Actualizar sistema de part铆culas
    this.particleSystem.update(this.canvas);
    
    // Aplicar efectos especiales
    this.applyEffects();
    
    // Dibujar sistema usando el m茅todo original del particle system
    this.particleSystem.draw(this.ctx);
    
    // Dibujar overlay de informaci贸n
    this.drawOverlay();
    
    // Actualizar UI
    this.updateUI();
    
    // Continuar animaci贸n
    this.animationId = requestAnimationFrame(() => this.animate());
}
	

    /**
     * Limpia el canvas seg煤n el modo configurado
     */
    clearCanvas() {
        switch (this.clearMode) {
            case 'clear':
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                break;
            case 'fade':
                this.ctx.fillStyle = this.backgroundColor;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                break;
            case 'accumulate':
                // No limpiar - acumular trails
                break;
        }
    }

    /**
     * Aplica efectos especiales
     */
    applyEffects() {
        if (this.effects.bloom) this.applyBloom();
        if (this.effects.chromatic) this.applyChromaticAberration();
        if (this.effects.noise) this.applyNoise();
        if (this.effects.distortion) this.applyDistortion();
    }

    /**
     * Efecto bloom
     */
    applyBloom() {
        this.ctx.shadowColor = '#ff006e';
        this.ctx.shadowBlur = 20;
    }

    /**
     * Aberraci贸n crom谩tica
     */
    applyChromaticAberration() {
        // Implementar efecto de aberraci贸n crom谩tica
    }

    /**
     * Ruido
     */
    applyNoise() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 10;
            data[i] += noise;     // R
            data[i + 1] += noise; // G
            data[i + 2] += noise; // B
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Distorsi贸n
     */
    applyDistortion() {
        // Implementar efecto de distorsi贸n
    }

    /**
     * Dibuja overlay de informaci贸n
     */
    drawOverlay() {
        if (this.showInfo) {
            this.drawDebugInfo();
        }
        
        this.drawWatermark();
    }

    /**
     * Informaci贸n de debug
     */
    drawDebugInfo() {
        const stats = this.particleSystem.getSystemStats();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 100);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${stats.fps}`, 20, 30);
        this.ctx.fillText(`Part铆culas: ${stats.particleCount}`, 20, 50);
        this.ctx.fillText(`Tiempo: ${stats.time}`, 20, 70);
        this.ctx.fillText(`Modo: ${this.renderMode}`, 20, 90);
    }

    /**
     * Marca de agua
     */
    drawWatermark() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.font = '10px Arial';
        this.ctx.fillText('Atractor de Lorenz', this.canvas.width - 120, this.canvas.height - 10);
    }

    /**
     * Actualiza la interfaz de usuario
     */
    updateUI() {
        this.updateInfoPanel();
        this.updateStatsPanel();
        this.updateSliders();
    }

    /**
     * Actualiza el panel de informaci贸n
     */
    updateInfoPanel() {
        const sigmaSpan = document.getElementById('sigma');
        const rhoSpan = document.getElementById('rho');
        const betaSpan = document.getElementById('beta');
        
        const lorenzInfo = this.particleSystem.lorenzSystem.getSystemInfo();
        
        if (sigmaSpan) sigmaSpan.textContent = lorenzInfo.parameters.sigma.toFixed(3);
        if (rhoSpan) rhoSpan.textContent = lorenzInfo.parameters.rho.toFixed(3);
        if (betaSpan) betaSpan.textContent = lorenzInfo.parameters.beta.toFixed(3);
    }

    /**
     * Actualiza el panel de estad铆sticas
     */
    updateStatsPanel() {
        if (!this.statsPanel) return;
        
        const stats = this.particleSystem.getSystemStats();
        this.statsPanel.innerHTML = `
            <div class="stat"><span>FPS:</span><span class="stat-value">${stats.fps}</span></div>
            <div class="stat"><span>Part铆culas:</span><span class="stat-value">${stats.particleCount}</span></div>
            <div class="stat"><span>Frames:</span><span class="stat-value">${stats.time}</span></div>
        `;
    }

    /**
     * Actualiza los sliders
     */
    updateSliders() {
        // Implementar actualizaci贸n de sliders
    }

    /**
     * Manejo de eventos del mouse
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        
        if (this.mouse.isDown) {
            // Rotar atractor con mouse
            const deltaX = e.movementX || 0;
            const deltaY = e.movementY || 0;
            
            this.particleSystem.rotationY += deltaX * 0.01;
            this.particleSystem.rotationX += deltaY * 0.01;
        }
    }

    handleMouseDown(e) {
        this.mouse.isDown = true;
        this.canvas.style.cursor = 'grabbing';
    }

    handleMouseUp(e) {
        this.mouse.isDown = false;
        this.canvas.style.cursor = 'grab';
    }

    handleWheel(e) {
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.particleSystem.scale *= scaleFactor;
        this.particleSystem.scale = Math.max(1, Math.min(20, this.particleSystem.scale));
    }

    /**
     * Manejo de eventos t谩ctiles
     */
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touch.isActive = true;
        this.touch.x = touch.clientX;
        this.touch.y = touch.clientY;
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touch.isActive) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touch.x;
        const deltaY = touch.clientY - this.touch.y;
        
        this.particleSystem.rotationY += deltaX * 0.005;
        this.particleSystem.rotationX += deltaY * 0.005;
        
        this.touch.x = touch.clientX;
        this.touch.y = touch.clientY;
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.touch.isActive = false;
    }

    /**
     * Manejo de eventos del teclado
     */
    handleKeyDown(e) {
        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'r':
            case 'R':
                this.reset();
                break;
            case 'i':
            case 'I':
                this.toggleInfo();
                break;
            case 'f':
            case 'F':
                this.toggleFullscreen();
                break;
            case '1':
                this.setRenderMode('low');
                break;
            case '2':
                this.setRenderMode('medium');
                break;
            case '3':
                this.setRenderMode('high');
                break;
            case '4':
                this.setRenderMode('ultra');
                break;
            case 'c':
            case 'C':
                this.toggleChaosMode();
                break;
            case 'b':
            case 'B':
                this.effects.bloom = !this.effects.bloom;
                break;
            case 'n':
            case 'N':
                this.effects.noise = !this.effects.noise;
                break;
        }
    }

    /**
     * Manejo de redimensionamiento
     */
    handleResize() {
        this.setupCanvas();
    }

    /**
     * Manejo de cambio de visibilidad
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else if (this.isPlaying) {
            this.play();
        }
    }

    /**
     * Controles principales
     */
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        this.isPaused = false;
        this.animate();
        
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.textContent = '鈴� Pausar';
            playBtn.classList.add('active');
        }
    }

    pause() {
        this.isPlaying = false;
        this.isPaused = true;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.textContent = '鈻� Reproducir';
            playBtn.classList.remove('active');
        }
    }

    reset() {
        this.particleSystem.reset();
        
        // Efecto visual de reset
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Animaci贸n de reset
        if (typeof anime !== 'undefined') {
            anime({
                targets: this.canvas,
                scale: [0.95, 1],
                duration: 500,
                easing: 'easeOutElastic(1, .6)'
            });
        }
        
        console.log('馃攧 Sistema reiniciado');
    }

    toggleSpeed() {
        const speeds = [0.5, 1, 2, 3];
        const currentSpeed = this.particleSystem.lorenzSystem.dt * 100;
        const currentIndex = speeds.findIndex(speed => Math.abs(speed - currentSpeed) < 0.1);
        const nextIndex = (currentIndex + 1) % speeds.length;
        const newSpeed = speeds[nextIndex];
        
        this.particleSystem.lorenzSystem.dt = newSpeed / 100;
        
        const speedBtn = document.getElementById('speedBtn');
        if (speedBtn) {
            const speedNames = ['Lento', 'Normal', 'R谩pido', 'Turbo'];
            speedBtn.textContent = `鈿� ${speedNames[nextIndex]}`;
        }
    }

  toggleInfo() {
    this.showInfo = !this.showInfo;
    
    const infoPanel = document.getElementById('infoPanel');
    const infoBtn = document.getElementById('infoBtn');
    
    console.log(`鈩癸笍 Toggle Info: ${this.showInfo ? 'Mostrar' : 'Ocultar'}`);
    
    if (infoPanel) {
        if (this.showInfo) {
            // Mostrar panel
            infoPanel.classList.add('visible');
            infoPanel.style.display = 'block';
            infoPanel.style.opacity = '1';
            infoPanel.style.pointerEvents = 'auto';
            
            // Asegurar que est茅 encima de todo
            infoPanel.style.zIndex = '200';
            
            console.log('鉁� Panel Info mostrado');
        } else {
            // Ocultar panel
            infoPanel.classList.remove('visible');
            infoPanel.style.opacity = '0';
            infoPanel.style.pointerEvents = 'none';
            
            // Ocultar despu茅s de la animaci贸n
            setTimeout(() => {
                if (!this.showInfo) {
                    infoPanel.style.display = 'none';
                }
            }, 300);
            
            console.log('鉂� Panel Info oculto');
        }
    }
    
    // Actualizar bot贸n
    if (infoBtn) {
        if (this.showInfo) {
            infoBtn.classList.add('active');
            infoBtn.style.background = 'rgba(255, 0, 110, 0.2)';
            infoBtn.style.borderColor = '#ff006e';
            infoBtn.style.color = '#ff006e';
        } else {
            infoBtn.classList.remove('active');
            infoBtn.style.background = 'rgba(0, 217, 255, 0.1)';
            infoBtn.style.borderColor = 'rgba(0, 217, 255, 0.4)';
            infoBtn.style.color = 'white';
        }
    }
    
    // Agregar bot贸n de cerrar en m贸vil
    if (this.showInfo && window.innerWidth <= 767) {
        this.addMobileCloseButton();
    }
}

    toggleFullscreen() {
        if (!this.fullscreen) {
            if (this.canvas.requestFullscreen) {
                this.canvas.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        this.fullscreen = !this.fullscreen;
    }

    toggleChaosMode() {
        this.particleSystem.chaosMode = !this.particleSystem.chaosMode;
        
        if (this.particleSystem.chaosMode) {
            this.canvas.classList.add('chaos-mode');
            console.log('馃尓锔� Modo caos activado');
        } else {
            this.canvas.classList.remove('chaos-mode');
            console.log('馃 Modo normal activado');
        }
    }

    /**
     * Configuraci贸n de calidad de renderizado
     */
    setRenderMode(mode) {
        this.renderMode = mode;
        
        switch (mode) {
            case 'low':
                this.particleSystem.configure({
                    particleCount: 3,
                    trailLength: 200
                });
                this.clearMode = 'clear';
                break;
            case 'medium':
                this.particleSystem.configure({
                    particleCount: 5,
                    trailLength: 400
                });
                this.clearMode = 'fade';
                break;
            case 'high':
                this.particleSystem.configure({
                    particleCount: 7,
                    trailLength: 600
                });
                this.clearMode = 'fade';
                break;
            case 'ultra':
                this.particleSystem.configure({
                    particleCount: 10,
                    trailLength: 800
                });
                this.clearMode = 'accumulate';
                this.effects.bloom = true;
                break;
        }
        
        console.log(`馃帹 Modo de renderizado: ${mode}`);
    }

    /**
     * Actualizaci贸n de par谩metros
     */
    updateParameter(param, value) {
        const numValue = parseFloat(value);
        
        switch (param) {
            case 'sigma':
                this.particleSystem.lorenzSystem.sigma = numValue;
                break;
            case 'rho':
                this.particleSystem.lorenzSystem.rho = numValue;
                break;
            case 'beta':
                this.particleSystem.lorenzSystem.beta = numValue;
                break;
            case 'scale':
                this.particleSystem.scale = numValue;
                break;
            case 'speed':
                this.particleSystem.lorenzSystem.dt = numValue / 100;
                break;
        }
        
        console.log(`馃搳 ${param} actualizado a: ${numValue}`);
    }

    /**
     * Funci髇 de compartir
     */
async share() {
    try {
        console.log('?? Iniciando funci髇 compartir...');
        
        // Capturar frame actual
        const imageData = this.canvas.toDataURL('image/png');
        
        // Preparar datos para compartir
        const shareData = {
            title: 'Atractor de Lorenz - La Belleza del Caos',
            text: 'Explora la ciencia detr醩 del Efecto Mariposa con esta visualizaci髇 interactiva del famoso Atractor de Lorenz.',
            url: window.location.href
        };
        
        console.log('?? Intentando Web Share API...');
        
        // Opci髇 1: Web Share API (m髒iles modernos)
        if (navigator.share) {
            await navigator.share(shareData);
            this.showNotification('?? Contenido compartido exitosamente');
            console.log('? Compartido con Web Share API');
            return;
        }
        
        console.log('?? Web Share API no disponible, usando clipboard...');
        
        // Opci髇 2: Clipboard API (requiere HTTPS)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(window.location.href);
            this.showNotification('?? URL copiada al portapapeles');
            console.log('? URL copiada con Clipboard API');
            return;
        }
        
        console.log('?? Clipboard API no disponible, usando m閠odo legacy...');
        
        // Opci髇 3: M閠odo legacy (funciona en HTTP)
        const textArea = document.createElement('textarea');
        textArea.value = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                this.showNotification('?? Informaci髇 copiada al portapapeles');
                console.log('? Informaci髇 copiada con execCommand');
            } else {
                throw new Error('execCommand failed');
            }
        } catch (execError) {
            document.body.removeChild(textArea);
            throw execError;
        }
        
    } catch (error) {
        console.error('? Error al compartir:', error);
        
        // Opci髇 4: Fallback manual
        const shareText = `Atractor de Lorenz - La Belleza del Caos
Explora la ciencia detr醩 del Efecto Mariposa
${window.location.href}`;
        
        // Mostrar modal con informaci髇 para copiar manualmente
        this.showShareModal(shareText);
    }
}

/**
 * AGREGAR ESTA NUEVA FUNCI覰 despu閟 de la funci髇 share()
 */
showShareModal(shareText) {
    // Crear modal de compartir
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(10px);
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: rgba(20, 20, 20, 0.95);
        padding: 30px;
        border-radius: 15px;
        border: 2px solid #ff006e;
        max-width: 90%;
        max-height: 80%;
        overflow-y: auto;
        text-align: center;
    `;
    
    content.innerHTML = `
        <h3 style="color: #ff006e; margin-bottom: 20px; font-size: 1.2rem;">
            ?? Compartir Atractor de Lorenz
        </h3>
        <p style="color: #cccccc; margin-bottom: 20px; font-size: 0.9rem;">
            Copia este texto para compartir:
        </p>
        <textarea readonly style="
            width: 100%;
            min-height: 100px;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #ff006e;
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-size: 0.85rem;
            line-height: 1.4;
            resize: none;
            margin-bottom: 20px;
        ">${shareText}</textarea>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button id="copyManualBtn" style="
                background: #ff006e;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 600;
            ">?? Copiar Texto</button>
            <button id="closeModalBtn" style="
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 2px solid #666;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 600;
            ">? Cerrar</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Event listeners
    const textarea = content.querySelector('textarea');
    const copyBtn = content.querySelector('#copyManualBtn');
    const closeBtn = content.querySelector('#closeModalBtn');
    
    copyBtn.addEventListener('click', () => {
        textarea.select();
        try {
            document.execCommand('copy');
            copyBtn.textContent = '? Copiado';
            copyBtn.style.background = '#2ed573';
            setTimeout(() => {
                modal.remove();
                this.showNotification('?? Texto copiado manualmente');
            }, 1000);
        } catch (e) {
            copyBtn.textContent = '? Error';
            copyBtn.style.background = '#ff4757';
        }
    });
    
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Auto-seleccionar texto
    textarea.select();
    textarea.focus();
}

    /**
     * Captura de pantalla
     */
    captureFrame() {
        const link = document.createElement('a');
        link.download = `lorenz-attractor-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
        
        this.showNotification('馃摳 Imagen guardada');
    }

    /**
     * Grabaci贸n de video (experimental)
     */
    startRecording() {
        if (!this.mediaRecorder) {
            const stream = this.canvas.captureStream(30);
            this.mediaRecorder = new MediaRecorder(stream);
            this.recordedChunks = [];
            
            this.mediaRecorder.ondataavailable = (e) => {
                this.recordedChunks.push(e.data);
            };
            
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `lorenz-attractor-${Date.now()}.webm`;
                link.click();
                
                this.showNotification('馃帴 Video guardado');
            };
        }
        
        if (this.mediaRecorder.state === 'inactive') {
            this.mediaRecorder.start();
            this.showNotification('馃敶 Grabando...');
        } else {
            this.mediaRecorder.stop();
        }
    }

    /**
     * Mostrar notificaciones
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-size: 14px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Exportar configuraci贸n
     */
    exportConfig() {
        const config = {
            lorenzParams: this.particleSystem.lorenzSystem.getSystemInfo().parameters,
            visualConfig: {
                renderMode: this.renderMode,
                particleCount: this.particleSystem.particles.length,
                scale: this.particleSystem.scale,
                effects: this.effects,
                clearMode: this.clearMode
            },
            timestamp: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(config, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `lorenz-config-${Date.now()}.json`;
        link.click();
        
        this.showNotification('鈿欙笍 Configuraci贸n exportada');
    }

    /**
     * Importar configuraci贸n
     */
    importConfig(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                
                // Aplicar configuraci贸n de Lorenz
                if (config.lorenzParams) {
                    this.particleSystem.lorenzSystem.updateParameters(
                        config.lorenzParams.sigma,
                        config.lorenzParams.rho,
                        config.lorenzParams.beta
                    );
                }
                
                // Aplicar configuraci贸n visual
                if (config.visualConfig) {
                    this.setRenderMode(config.visualConfig.renderMode);
                    this.particleSystem.scale = config.visualConfig.scale;
                    this.effects = { ...this.effects, ...config.visualConfig.effects };
                    this.clearMode = config.visualConfig.clearMode;
                }
                
                this.showNotification('鉁� Configuraci贸n importada');
            } catch (error) {
                console.error('Error al importar configuraci贸n:', error);
                this.showNotification('鉂� Error al importar configuraci贸n');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Obtener informaci贸n del sistema
     */
    getSystemInfo() {
        return {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            performance: {
                fps: this.particleSystem.getSystemStats().fps,
                renderMode: this.renderMode,
                particleCount: this.particleSystem.particles.length
            },
            lorenz: this.particleSystem.lorenzSystem.getSystemInfo(),
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height,
                devicePixelRatio: window.devicePixelRatio
            },
            browser: {
                userAgent: navigator.userAgent,
                webgl: !!window.WebGLRenderingContext
            }
        };
    }

    /**
     * Destructor
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remover event listeners
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('wheel', this.handleWheel);
        
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        console.log('馃棏锔� Visualizador destruido');
    }

/**
 * Fuerza el recentrado del atractor
 */
forceCenterAttractor() {
    if (this.particleSystem && this.canvasCenter) {
        // Actualizar centro en el sistema de Lorenz
        if (this.particleSystem.lorenzSystem) {
            this.particleSystem.lorenzSystem.centerX = this.canvasCenter.x;
            this.particleSystem.lorenzSystem.centerY = this.canvasCenter.y;
        }
        
        // Limpiar trails para recentrar visualizaci贸n
        this.particleSystem.particles.forEach(particle => {
            if (particle.trail) {
                particle.trail = [];
            }
        });
        
        console.log(`馃幆 Atractor recentrado en: (${this.canvasCenter.x}, ${this.canvasCenter.y})`);
    }
}

/**
 * MODIFICAR la funci贸n handleResize() existente
 * Buscar y reemplazar handleResize() con esta versi贸n:
 */
/**
 * MODIFICAR la funci贸n handleResize() existente
 * Buscar y reemplazar handleResize() con esta versi贸n:
 */
handleResize() {
    // Esperar a que el resize termine
    setTimeout(() => {
        this.setupCanvas();
        this.forceCenterAttractor(); // Asegurar centrado despu茅s del resize
        console.log('馃攧 Canvas redimensionado y recentrado');
    }, 100);
}

/**
 * Agregar bot贸n cerrar para m贸vil
 */
addMobileCloseButton() {
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel) return;
    
    // Verificar si ya existe el bot贸n
    let closeBtn = infoPanel.querySelector('.close-btn');
    if (!closeBtn) {
        closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '鉁� Cerrar';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 0, 110, 0.2);
            border: 2px solid #ff006e;
            color: #ff006e;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: bold;
            z-index: 201;
        `;
        
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleInfo();
        });
        
        infoPanel.appendChild(closeBtn);
    }
}
}  // 鈫� Este es el cierre de la clase ChaosVisualization

// Inicializaci贸n autom谩tica cuando el DOM est茅 listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que se carguen las dependencias
    const initVisualization = () => {
        if (typeof LorenzSystem !== 'undefined' && typeof ParticleSystem !== 'undefined') {
            window.chaosViz = new ChaosVisualization('lorenzCanvas');
            
            // Auto-inicio con delay
            setTimeout(() => {
                window.chaosViz.play();
            }, 2000);
        } else {
            // Reintentar en 100ms
            setTimeout(initVisualization, 100);
        }
    };
    
    initVisualization();
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChaosVisualization;
}// JavaScript Document