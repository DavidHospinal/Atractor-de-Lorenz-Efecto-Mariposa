/**
 * UI-CONTROLLER.JS
 * Controlador de la interfaz de usuario
 */

class UIController {
    constructor(chaosVisualization) {
        this.viz = chaosVisualization;
        this.elements = {};
        this.state = {
            infoVisible: false,
            qualityPanelVisible: false,
            helpVisible: false,
            fullscreen: false
        };
        
        this.initialize();
    }

    /**
     * Inicialización del controlador de UI
     */
    initialize() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupSliders();
        this.setupToggles();
        //this.setupQualityControls();
        this.updateDisplay();
        
        console.log('🎮 UI Controller inicializado');
    }

    /**
     * Cache de elementos del DOM
     */
    cacheElements() {
        this.elements = {
            // Controles principales
            playBtn: document.getElementById('playBtn'),
            resetBtn: document.getElementById('resetBtn'),
            speedBtn: document.getElementById('speedBtn'),
            infoBtn: document.getElementById('infoBtn'),
            shareBtn: document.getElementById('shareBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            captureBtn: document.getElementById('captureBtn'),
            
            // Paneles
            infoPanel: document.getElementById('infoPanel'),
            statsPanel: document.getElementById('statsPanel'),
             // qualityPanel: document.getElementById('qualityPanel'),
            helpModal: document.getElementById('helpModal'),
            
            // Sliders
            sigmaSlider: document.getElementById('sigmaSlider'),
            rhoSlider: document.getElementById('rhoSlider'),
            betaSlider: document.getElementById('betaSlider'),
            scaleSlider: document.getElementById('scaleSlider'),
            speedSlider: document.getElementById('speedSlider'),
            
            // Toggles de efectos
            bloomEffect: document.getElementById('bloomEffect'),
            connectionsEffect: document.getElementById('connectionsEffect'),
            chaosEffect: document.getElementById('chaosEffect'),
            
            // Displays de valores
            sigma: document.getElementById('sigma'),
            rho: document.getElementById('rho'),
            beta: document.getElementById('beta'),
            fpsCounter: document.getElementById('fpsCounter'),
            particleCount: document.getElementById('particleCount'),
            frameCount: document.getElementById('frameCount'),
            elapsedTime: document.getElementById('elapsedTime'),
            attractorType: document.getElementById('attractorType'),
            activeRegion: document.getElementById('activeRegion'),
            divergence: document.getElementById('divergence'),
            
            // Otros elementos
            //interactionOverlay: document.getElementById('interactionOverlay'),
            closeHelp: document.getElementById('closeHelp')
        };
    }

    /**
     * Configuración de event listeners
     */
    setupEventListeners() {
        // Controles principales
        if (this.elements.playBtn) {
            this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        }
        
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.reset());
        }
        
        if (this.elements.speedBtn) {
            this.elements.speedBtn.addEventListener('click', () => this.toggleSpeed());
        }
        
        if (this.elements.infoBtn) {
            this.elements.infoBtn.addEventListener('click', () => this.toggleInfo());
        }
        
        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', () => this.share());
        }
        
        if (this.elements.fullscreenBtn) {
            this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
        
        if (this.elements.captureBtn) {
            this.elements.captureBtn.addEventListener('click', () => this.captureFrame());
        }
        
        // Modal de ayuda
        if (this.elements.closeHelp) {
            this.elements.closeHelp.addEventListener('click', () => this.hideHelp());
        }
        
        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideHelp();
                this.hideInfo();
            }
            
            if (e.key === 'h' || e.key === 'H') {
                this.showHelp();
            }
        });
        /*
        // Ocultar hint de interacción después de un tiempo
        setTimeout(() => {
            if (this.elements.interactionOverlay) {
                this.elements.interactionOverlay.style.opacity = '0';
                setTimeout(() => {
                    this.elements.interactionOverlay.style.display = 'none';
                }, 1000);
            }
        }, 5000);
		
		*/
        
        // Detectar cambios de pantalla completa
        document.addEventListener('fullscreenchange', () => {
            this.state.fullscreen = !!document.fullscreenElement;
            this.updateFullscreenButton();
        });
        
        // Actualización periódica de stats
        setInterval(() => this.updateStats(), 1000);
    }

    /**
     * Configuración de sliders
     */
    setupSliders() {
        const sliders = [
            { element: this.elements.sigmaSlider, param: 'sigma', display: this.elements.sigma },
            { element: this.elements.rhoSlider, param: 'rho', display: this.elements.rho },
            { element: this.elements.betaSlider, param: 'beta', display: this.elements.beta },
            { element: this.elements.scaleSlider, param: 'scale', display: null },
            { element: this.elements.speedSlider, param: 'speed', display: null }
        ];
        
        sliders.forEach(({ element, param, display }) => {
            if (element) {
                element.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    this.updateParameter(param, value);
                    
                    if (display) {
                        display.textContent = value.toFixed(3);
                    }
                });
                
                // Actualizar valor inicial
                if (display && param !== 'scale' && param !== 'speed') {
                    const lorenzInfo = this.viz.particleSystem.lorenzSystem.getSystemInfo();
                    display.textContent = lorenzInfo.parameters[param].toFixed(3);
                }
            }
        });
    }

    /**
     * Configuración de toggles de efectos
     */
    setupToggles() {
        const toggles = [
            { element: this.elements.bloomEffect, effect: 'bloom' },
            { element: this.elements.connectionsEffect, effect: 'showConnections' },
            { element: this.elements.chaosEffect, effect: 'chaosMode' }
        ];
        
        toggles.forEach(({ element, effect }) => {
            if (element) {
                element.addEventListener('change', (e) => {
                    const isEnabled = e.target.checked;
                    this.toggleEffect(effect, isEnabled);
                });
            }
        });
    }

    /**
     * Configuración de controles de calidad
     */
	
/*	
setupQualityControls() {
    const qualityButtons = document.querySelectorAll('.quality-btn');
    
    // Función para actualizar estado visual
    const updateQualityButtons = (activeQuality) => {
        qualityButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.quality === activeQuality) {
                btn.classList.add('active');
            }
        });
    };
    
    // Event listeners para cada botón
    qualityButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const quality = button.dataset.quality;
            
            console.log(`🎨 Cambiando calidad a: ${quality}`);
            
            // Actualizar estado visual inmediatamente
            updateQualityButtons(quality);
            
            // Aplicar configuración de calidad
            this.setQuality(quality);
            
            // Mostrar feedback
            this.showNotification(`🎨 Calidad: ${quality.toUpperCase()}`, 'success');
        });
    });
    
    // Establecer calidad inicial
    updateQualityButtons('medium');
}*/

    /**
     * Actualización del display
     */
    updateDisplay() {
        this.updateParameterDisplays();
        this.updateStats();
        this.updateSystemInfo();
    }

    /**
     * Actualizar displays de parámetros
     */
    updateParameterDisplays() {
        if (!this.viz || !this.viz.particleSystem) return;
        
        const lorenzInfo = this.viz.particleSystem.lorenzSystem.getSystemInfo();
        
        if (this.elements.sigma) {
            this.elements.sigma.textContent = lorenzInfo.parameters.sigma.toFixed(3);
        }
        if (this.elements.rho) {
            this.elements.rho.textContent = lorenzInfo.parameters.rho.toFixed(3);
        }
        if (this.elements.beta) {
            this.elements.beta.textContent = lorenzInfo.parameters.beta.toFixed(3);
        }
    }

    /**
     * Actualizar estadísticas
     */
    updateStats() {
        if (!this.viz || !this.viz.particleSystem) return;
        
        const stats = this.viz.particleSystem.getSystemStats();
        
        if (this.elements.fpsCounter) {
            this.elements.fpsCounter.textContent = stats.fps;
        }
        if (this.elements.particleCount) {
            this.elements.particleCount.textContent = stats.particleCount;
        }
        if (this.elements.frameCount) {
            this.elements.frameCount.textContent = stats.time;
        }
        if (this.elements.elapsedTime) {
            const seconds = Math.floor(stats.time / 60);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            this.elements.elapsedTime.textContent = 
                `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Actualizar información del sistema
     */
    updateSystemInfo() {
        if (!this.viz || !this.viz.particleSystem) return;
        
        const lorenzInfo = this.viz.particleSystem.lorenzSystem.getSystemInfo();
        
        if (this.elements.attractorType) {
            this.elements.attractorType.textContent = lorenzInfo.attractorType;
        }
        
        // Simular detección de región activa
        if (this.elements.activeRegion && this.viz.particleSystem.particles.length > 0) {
            const particle = this.viz.particleSystem.particles[0];
            const region = this.viz.particleSystem.lorenzSystem.detectAttractorRegion(
                particle.x, particle.y, particle.z
            );
            this.elements.activeRegion.textContent = this.formatRegionName(region);
        }
        
        // Calcular divergencia aproximada
        if (this.elements.divergence && this.viz.particleSystem.particles.length > 1) {
            const p1 = this.viz.particleSystem.particles[0];
            const p2 = this.viz.particleSystem.particles[1];
            const distance = Math.sqrt(
                Math.pow(p1.x - p2.x, 2) + 
                Math.pow(p1.y - p2.y, 2) + 
                Math.pow(p1.z - p2.z, 2)
            );
            
            let divergenceLevel = 'Baja';
            if (distance > 10) divergenceLevel = 'Media';
            if (distance > 20) divergenceLevel = 'Alta';
            if (distance > 30) divergenceLevel = 'Extrema';
            
            this.elements.divergence.textContent = divergenceLevel;
        }
    }

    /**
     * Formatear nombre de región
     */
    formatRegionName(region) {
        const regionNames = {
            'center': 'Centro',
            'right_wing': 'Ala Derecha',
            'left_wing': 'Ala Izquierda',
            'transition': 'Transición',
            'unknown': 'Desconocida'
        };
        return regionNames[region] || region;
    }

    /**
     * Controles principales
     */
    togglePlay() {
        if (this.viz) {
            this.viz.togglePlay();
            this.updatePlayButton();
        }
    }

    reset() {
        if (this.viz) {
            this.viz.reset();
            this.showNotification('🔄 Sistema reiniciado');
        }
    }

    toggleSpeed() {
        if (this.viz) {
            this.viz.toggleSpeed();
        }
    }

    toggleInfo() {
        this.state.infoVisible = !this.state.infoVisible;
        
        if (this.elements.infoPanel) {
            this.elements.infoPanel.classList.toggle('visible', this.state.infoVisible);
        }
        
        if (this.elements.infoBtn) {
            this.elements.infoBtn.classList.toggle('active', this.state.infoVisible);
        }
    }

    hideInfo() {
        this.state.infoVisible = false;
        
        if (this.elements.infoPanel) {
            this.elements.infoPanel.classList.remove('visible');
        }
        
        if (this.elements.infoBtn) {
            this.elements.infoBtn.classList.remove('active');
        }
    }

    async share() {
        if (this.viz) {
            await this.viz.share();
        }
    }

    toggleFullscreen() {
        if (this.viz) {
            this.viz.toggleFullscreen();
        }
    }

    captureFrame() {
        if (this.viz) {
            this.viz.captureFrame();
        }
    }

    /**
     * Actualizar botones
     */
    updatePlayButton() {
        if (!this.elements.playBtn || !this.viz) return;
        
        const isPlaying = this.viz.isPlaying;
        const iconSpan = this.elements.playBtn.querySelector('.btn-icon');
        const textSpan = this.elements.playBtn.querySelector('.btn-text');
        
        if (iconSpan) {
            iconSpan.textContent = isPlaying ? '⏸' : '▶';
        }
        if (textSpan) {
            textSpan.textContent = isPlaying ? 'Pausar' : 'Reproducir';
        }
        
        this.elements.playBtn.classList.toggle('active', isPlaying);
    }

    updateFullscreenButton() {
        if (!this.elements.fullscreenBtn) return;
        
        const iconSpan = this.elements.fullscreenBtn.querySelector('.btn-icon');
        const textSpan = this.elements.fullscreenBtn.querySelector('.btn-text');
        
        if (iconSpan) {
            iconSpan.textContent = this.state.fullscreen ? '⛶' : '⛶';
        }
        if (textSpan) {
            textSpan.textContent = this.state.fullscreen ? 'Salir' : 'Pantalla';
        }
    }

    /**
     * Actualizar parámetros
     */
    updateParameter(param, value) {
        if (!this.viz) return;
        
        switch (param) {
            case 'sigma':
                this.viz.particleSystem.lorenzSystem.sigma = value;
                break;
            case 'rho':
                this.viz.particleSystem.lorenzSystem.rho = value;
                break;
            case 'beta':
                this.viz.particleSystem.lorenzSystem.beta = value;
                break;
            case 'scale':
                this.viz.particleSystem.scale = value;
                break;
            case 'speed':
                this.viz.particleSystem.lorenzSystem.dt = value / 100;
                break;
        }
        
        // Actualizar displays
        this.updateSystemInfo();
    }

    /**
     * Toggle de efectos
     */
    toggleEffect(effect, enabled) {
        if (!this.viz) return;
        
        switch (effect) {
            case 'bloom':
                this.viz.effects.bloom = enabled;
                break;
            case 'showConnections':
                this.viz.particleSystem.showConnections = enabled;
                break;
            case 'chaosMode':
                this.viz.particleSystem.chaosMode = enabled;
                if (enabled) {
                    this.showNotification('🌪️ Modo caos activado');
                } else {
                    this.showNotification('🦋 Modo normal activado');
                }
                break;
        }
    }

    /**
     * Configurar calidad
     */
  setQuality(quality) {
    if (!this.viz) return;
    
    console.log(`🔧 Aplicando calidad: ${quality}`);
    
    switch (quality) {
        case 'low':
            this.viz.particleSystem.configure({
                particleCount: 3
            });
            this.viz.setRenderMode('low');
            // Configurar trails más cortos
            this.viz.particleSystem.particles.forEach(p => {
                p.maxTrailLength = 200;
            });
            break;
            
        case 'medium':
            this.viz.particleSystem.configure({
                particleCount: 5
            });
            this.viz.setRenderMode('medium');
            this.viz.particleSystem.particles.forEach(p => {
                p.maxTrailLength = 400;
            });
            break;
            
        case 'high':
            this.viz.particleSystem.configure({
                particleCount: 7
            });
            this.viz.setRenderMode('high');
            this.viz.particleSystem.particles.forEach(p => {
                p.maxTrailLength = 600;
            });
            break;
            
        case 'ultra':
            this.viz.particleSystem.configure({
                particleCount: 10
            });
            this.viz.setRenderMode('ultra');
            this.viz.particleSystem.particles.forEach(p => {
                p.maxTrailLength = 800;
            });
            // Activar efectos especiales
            this.viz.effects.bloom = true;
            break;
    }
    
    // Reinicializar partículas para aplicar cambios
    this.viz.particleSystem.initialize(this.viz.particleSystem.particles.length);
    
    console.log(`✅ Calidad ${quality} aplicada`);
}

    /**
     * Modal de ayuda
     */
    showHelp() {
        if (this.elements.helpModal) {
            this.elements.helpModal.style.display = 'flex';
            this.state.helpVisible = true;
        }
    }

    hideHelp() {
        if (this.elements.helpModal) {
            this.elements.helpModal.style.display = 'none';
            this.state.helpVisible = false;
        }
    }

    /**
     * Notificaciones
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideInFromRight 0.3s ease-out;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove
        setTimeout(() => {
            notification.style.animation = 'slideOutToRight 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    /**
     * Obtener color de notificación
     */
    getNotificationColor(type) {
        const colors = {
            info: 'rgba(58, 134, 255, 0.9)',
            success: 'rgba(46, 213, 115, 0.9)',
            warning: 'rgba(255, 190, 11, 0.9)',
            error: 'rgba(255, 71, 87, 0.9)'
        };
        return colors[type] || colors.info;
    }

    /**
     * Exportar configuración actual
     */
    exportConfiguration() {
        if (!this.viz) return;
        
        const config = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            lorenzParameters: this.viz.particleSystem.lorenzSystem.getSystemInfo().parameters,
            visualSettings: {
                scale: this.viz.particleSystem.scale,
                renderMode: this.viz.renderMode,
                effects: { ...this.viz.effects },
                particleCount: this.viz.particleSystem.particles.length
            },
            uiState: { ...this.state }
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `lorenz-config-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('⚙️ Configuración exportada', 'success');
    }

    /**
     * Importar configuración
     */
    importConfiguration(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                this.applyConfiguration(config);
                this.showNotification('✅ Configuración importada', 'success');
            } catch (error) {
                console.error('Error importing configuration:', error);
                this.showNotification('❌ Error al importar configuración', 'error');
            }
        };
        
        reader.readAsText(file);
    }

    /**
     * Aplicar configuración
     */
    applyConfiguration(config) {
        if (!this.viz || !config) return;
        
        // Aplicar parámetros de Lorenz
        if (config.lorenzParameters) {
            const params = config.lorenzParameters;
            this.viz.particleSystem.lorenzSystem.updateParameters(
                params.sigma, params.rho, params.beta
            );
            
            // Actualizar sliders
            if (this.elements.sigmaSlider) this.elements.sigmaSlider.value = params.sigma;
            if (this.elements.rhoSlider) this.elements.rhoSlider.value = params.rho;
            if (this.elements.betaSlider) this.elements.betaSlider.value = params.beta;
        }
        
        // Aplicar configuración visual
        if (config.visualSettings) {
            const visual = config.visualSettings;
            this.viz.particleSystem.scale = visual.scale || 8;
            this.viz.setRenderMode(visual.renderMode || 'medium');
            
            if (visual.effects) {
                this.viz.effects = { ...this.viz.effects, ...visual.effects };
                
                // Actualizar toggles
                if (this.elements.bloomEffect) this.elements.bloomEffect.checked = visual.effects.bloom;
                if (this.elements.connectionsEffect) this.elements.connectionsEffect.checked = visual.effects.showConnections;
                if (this.elements.chaosEffect) this.elements.chaosEffect.checked = visual.effects.chaosMode;
            }
        }
        
        // Actualizar displays
        this.updateDisplay();
    }

    /**
     * Obtener información del estado de la UI
     */
    getUIState() {
        return {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            state: { ...this.state },
            elements: Object.keys(this.elements).filter(key => this.elements[key] !== null),
            performance: {
                fps: this.viz ? this.viz.particleSystem.getSystemStats().fps : 0,
                renderMode: this.viz ? this.viz.renderMode : 'unknown'
            }
        };
    }

    /**
     * Destructor
     */
    destroy() {
        // Limpiar event listeners
        Object.values(this.elements).forEach(element => {
            if (element && element.removeEventListener) {
                element.removeEventListener('click', () => {});
                element.removeEventListener('input', () => {});
                element.removeEventListener('change', () => {});
            }
        });
        
        this.elements = {};
        this.viz = null;
        
        console.log('🗑️ UI Controller destruido');
    }
}

// CSS adicional para animaciones de notificación
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInFromRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutToRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}// JavaScript Document