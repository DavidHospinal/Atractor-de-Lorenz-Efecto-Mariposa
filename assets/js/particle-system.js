/**
 * PARTICLE-SYSTEM.JS
 * Sistema avanzado de partículas para el Atractor de Lorenz
 */

class Particle {
    constructor(x, y, z, id = 0) {
        // Posición en el espacio 3D
        this.x = x;
        this.y = y;
        this.z = z;
        
        // Propiedades visuales
        this.id = id;
        this.trail = [];
        this.maxTrailLength = 800;
        this.color = this.generateColor(id);
        this.size = 2 + Math.random() * 2;
        this.opacity = 1;
        
        // Propiedades de animación
        this.age = 0;
        this.energy = 1;
        this.speed = 1;
        this.lastPosition = {x, y, z};
        
        // Efectos especiales
        this.glowIntensity = 0.5 + Math.random() * 0.5;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.trailFadeRate = 0.02;
        
        // Estadísticas
        this.totalDistance = 0;
        this.maxSpeed = 0;
        this.region = 'unknown';
    }

    /**
     * Genera un color único para la partícula
     */
    generateColor(id) {
        const colors = [
            { primary: '#ff006e', secondary: '#ff4081' },
            { primary: '#8338ec', secondary: '#9c4dff' },
            { primary: '#3a86ff', secondary: '#5aa3ff' },
            { primary: '#06ffa5', secondary: '#4fffb0' },
            { primary: '#ffbe0b', secondary: '#ffd93d' },
            { primary: '#fb5607', secondary: '#ff7043' },
            { primary: '#e91e63', secondary: '#f06292' },
            { primary: '#9c27b0', secondary: '#ba68c8' }
        ];
        
        const colorSet = colors[id % colors.length];
        return {
            primary: colorSet.primary,
            secondary: colorSet.secondary,
            current: colorSet.primary
        };
    }

    /**
     * Actualiza la posición y propiedades de la partícula
     */
    update(lorenzSystem) {
        // Guardar posición anterior
        this.lastPosition = {x: this.x, y: this.y, z: this.z};
        
        // Calcular nueva posición usando Lorenz
        lorenzSystem.step(this);
        
        // Calcular velocidad y distancia
        const dx = this.x - this.lastPosition.x;
        const dy = this.y - this.lastPosition.y;
        const dz = this.z - this.lastPosition.z;
        const currentSpeed = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        this.maxSpeed = Math.max(this.maxSpeed, currentSpeed);
        this.totalDistance += currentSpeed;
        
        // Actualizar región del atractor
        this.region = lorenzSystem.detectAttractorRegion(this.x, this.y, this.z);
        
        // Actualizar color basado en velocidad y posición
        this.updateColor(currentSpeed);
        
        // Incrementar edad
        this.age++;
        
        // Actualizar energía basada en velocidad
        this.energy = Math.min(1, currentSpeed * 10);
    }

    /**
     * Actualiza el color basado en velocidad y posición
     */
    updateColor(speed) {
        const speedFactor = Math.min(1, speed * 5);
        const timeFactor = Math.sin(this.age * 0.01 + this.pulsePhase) * 0.5 + 0.5;
        
        // Mezclar colores basado en velocidad
        if (speedFactor > 0.7) {
            this.color.current = this.color.secondary;
        } else {
            this.color.current = this.color.primary;
        }
        
        // Ajustar opacidad basada en energía
        this.opacity = 0.7 + this.energy * 0.3;
        
        // Pulso basado en tiempo
        this.glowIntensity = 0.5 + timeFactor * 0.5;
    }

    /**
     * Añade un punto al trail
     */
    addTrailPoint(projectedPoint) {
        this.trail.push({
            ...projectedPoint,
            age: 0,
            opacity: this.opacity,
            size: this.size,
            color: this.color.current
        });
        
        // Limitar longitud del trail
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Actualizar edad de puntos del trail
        this.trail.forEach(point => {
            point.age++;
            point.opacity = Math.max(0, 1 - point.age * this.trailFadeRate);
        });
    }

    /**
     * Dibuja la partícula y su trail
     */
    draw(ctx, projectedPoint) {
        this.drawTrail(ctx);
        this.drawParticle(ctx, projectedPoint);
    }

    /**
     * Dibuja el trail de la partícula
     */
    drawTrail(ctx) {
        if (this.trail.length < 2) return;
        
        // Configurar contexto
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Crear gradiente para el trail
        const gradient = this.createTrailGradient(ctx);
        
        // Dibujar trail principal
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        
        for (let i = 1; i < this.trail.length; i++) {
            const point = this.trail[i];
            const prevPoint = this.trail[i - 1];
            
            // Control de opacidad por segmento
            const segmentOpacity = point.opacity * this.opacity;
            if (segmentOpacity > 0.01) {
                ctx.globalAlpha = segmentOpacity;
                ctx.strokeStyle = point.color;
                ctx.lineWidth = Math.max(0.5, point.size * segmentOpacity);
                
                ctx.beginPath();
                ctx.moveTo(prevPoint.x, prevPoint.y);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            }
        }
        
        // Dibujar efecto de resplandor
        this.drawTrailGlow(ctx);
        
        // Restaurar contexto
        ctx.globalAlpha = 1;
    }

    /**
     * Crea un gradiente para el trail
     */
    createTrailGradient(ctx) {
        if (this.trail.length < 2) return null;
        
        const start = this.trail[0];
        const end = this.trail[this.trail.length - 1];
        
        const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        gradient.addColorStop(0, this.color.primary + '20');
        gradient.addColorStop(0.5, this.color.secondary + '60');
        gradient.addColorStop(1, this.color.current + 'FF');
        
        return gradient;
    }

    /**
     * Dibuja efecto de resplandor en el trail
     */
    drawTrailGlow(ctx) {
        if (this.trail.length < 2) return;
        
        ctx.shadowColor = this.color.current;
        ctx.shadowBlur = 5 * this.glowIntensity;
        ctx.globalAlpha = 0.3;
        
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        
        ctx.strokeStyle = this.color.current;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Resetear sombra
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    /**
     * Dibuja la partícula principal
     */
    drawParticle(ctx, projectedPoint) {
        const { x, y } = projectedPoint;
        const pulseSize = this.size + Math.sin(this.age * 0.1 + this.pulsePhase) * 0.5;
        
        // Partícula principal
        ctx.beginPath();
        ctx.arc(x, y, pulseSize, 0, 2 * Math.PI);
        ctx.fillStyle = this.color.current;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        
        // Efecto de resplandor
        ctx.shadowColor = this.color.current;
        ctx.shadowBlur = 8 * this.glowIntensity;
        ctx.beginPath();
        ctx.arc(x, y, pulseSize * 0.8, 0, 2 * Math.PI);
        ctx.fillStyle = this.color.secondary;
        ctx.fill();
        
        // Núcleo brillante
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(x, y, pulseSize * 0.4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.fill();
        
        // Restaurar contexto
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    /**
     * Aplica una perturbación pequeña (efecto mariposa)
     */
    applyPerturbation(strength = 0.001) {
        this.x += (Math.random() - 0.5) * strength;
        this.y += (Math.random() - 0.5) * strength;
        this.z += (Math.random() - 0.5) * strength;
    }

    /**
     * Obtiene estadísticas de la partícula
     */
    getStats() {
        return {
            id: this.id,
            age: this.age,
            totalDistance: this.totalDistance,
            maxSpeed: this.maxSpeed,
            currentRegion: this.region,
            energy: this.energy,
            trailLength: this.trail.length
        };
    }

    /**
     * Resetea la partícula a una nueva posición
     */
    reset(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.trail = [];
        this.age = 0;
        this.totalDistance = 0;
        this.maxSpeed = 0;
        this.energy = 1;
    }
}

/**
 * Sistema completo de partículas
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.lorenzSystem = new LorenzSystem();
        this.time = 0;
        this.isActive = true;
        
        // Configuración visual
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationSpeed = 0.002;
        this.scale = 8;
        this.autoRotate = true;
        
        // Efectos especiales
        this.showConnections = false;
        this.showRegions = false;
        this.chaosMode = false;
        this.trailMode = 'normal'; // normal, glow, rainbow
        
        // Estadísticas
        this.stats = {
            frameCount: 0,
            averageFPS: 0,
            lastFrameTime: 0
        };
    }

    /**
     * Inicializa el sistema con partículas
     */
    initialize(particleCount = 5) {
        this.particles = [];
        const initialConditions = this.lorenzSystem.generateInitialConditions(particleCount);
        
        initialConditions.forEach((condition, index) => {
            const particle = new Particle(condition.x, condition.y, condition.z, index);
            this.particles.push(particle);
        });
    }

    /**
     * Actualiza todo el sistema
     */
    update(canvas) {
        if (!this.isActive) return;
        
        const currentTime = performance.now();
        this.calculateFPS(currentTime);
        
        // Actualizar rotación automática
        if (this.autoRotate) {
            this.rotationY += this.rotationSpeed;
        }
        
        // Actualizar cada partícula
        this.particles.forEach(particle => {
            particle.update(this.lorenzSystem);
            
            // Aplicar efectos especiales
            if (this.chaosMode && Math.random() < 0.01) {
                particle.applyPerturbation(0.1);
            }
            
            // Proyectar a 2D y añadir al trail
            const projected = this.lorenzSystem.project3Dto2D(
                particle.x, particle.y, particle.z,
                this.rotationX, this.rotationY,
                this.scale, canvas.width / 2, canvas.height / 2
            );
            
            particle.addTrailPoint(projected);
        });
        
        this.time++;
    }

    /**
     * Dibuja todo el sistema
     */
    draw(ctx) {
        // Aplicar efectos globales
        if (this.chaosMode) {
            ctx.filter = `hue-rotate(${this.time}deg)`;
        }
        
        // Dibujar conexiones entre partículas (opcional)
        if (this.showConnections) {
            this.drawConnections(ctx);
        }
        
        // Dibujar regiones del atractor (opcional)
        if (this.showRegions) {
            this.drawRegions(ctx);
        }
        
        // Dibujar cada partícula
        this.particles.forEach(particle => {
            const projected = this.lorenzSystem.project3Dto2D(
                particle.x, particle.y, particle.z,
                this.rotationX, this.rotationY,
                this.scale, ctx.canvas.width / 2, ctx.canvas.height / 2
            );
            
            particle.draw(ctx, projected);
        });
        
        // Resetear filtros
        ctx.filter = 'none';
    }

    /**
     * Dibuja conexiones entre partículas cercanas
     */
    drawConnections(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const distance = Math.sqrt(
                    Math.pow(p1.x - p2.x, 2) +
                    Math.pow(p1.y - p2.y, 2) +
                    Math.pow(p1.z - p2.z, 2)
                );
                
                if (distance < 10) {
                    const projected1 = this.lorenzSystem.project3Dto2D(
                        p1.x, p1.y, p1.z, this.rotationX, this.rotationY,
                        this.scale, ctx.canvas.width / 2, ctx.canvas.height / 2
                    );
                    const projected2 = this.lorenzSystem.project3Dto2D(
                        p2.x, p2.y, p2.z, this.rotationX, this.rotationY,
                        this.scale, ctx.canvas.width / 2, ctx.canvas.height / 2
                    );
                    
                    ctx.beginPath();
                    ctx.moveTo(projected1.x, projected1.y);
                    ctx.lineTo(projected2.x, projected2.y);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * (1 - distance / 10)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    /**
     * Dibuja regiones del atractor
     */
    drawRegions(ctx) {
        // Implementación para mostrar regiones del atractor
        // (centro, alas izquierda/derecha, transición)
    }

    /**
     * Calcula FPS
     */
    calculateFPS(currentTime) {
        if (this.stats.lastFrameTime > 0) {
            const deltaTime = currentTime - this.stats.lastFrameTime;
            const currentFPS = 1000 / deltaTime;
            this.stats.averageFPS = this.stats.averageFPS * 0.9 + currentFPS * 0.1;
        }
        this.stats.lastFrameTime = currentTime;
        this.stats.frameCount++;
    }

    /**
     * Obtiene estadísticas del sistema
     */
    getSystemStats() {
        return {
            particleCount: this.particles.length,
            time: this.time,
            fps: Math.round(this.stats.averageFPS),
            lorenzParams: this.lorenzSystem.getSystemInfo(),
            particleStats: this.particles.map(p => p.getStats())
        };
    }

    /**
     * Configuración del sistema
     */
    configure(options) {
        if (options.particleCount) this.initialize(options.particleCount);
        if (options.sigma !== undefined) this.lorenzSystem.sigma = options.sigma;
        if (options.rho !== undefined) this.lorenzSystem.rho = options.rho;
        if (options.beta !== undefined) this.lorenzSystem.beta = options.beta;
        if (options.scale !== undefined) this.scale = options.scale;
        if (options.autoRotate !== undefined) this.autoRotate = options.autoRotate;
        if (options.rotationSpeed !== undefined) this.rotationSpeed = options.rotationSpeed;
        if (options.showConnections !== undefined) this.showConnections = options.showConnections;
        if (options.chaosMode !== undefined) this.chaosMode = options.chaosMode;
    }

    /**
     * Resetea el sistema
     */
    reset() {
        this.time = 0;
        this.particles.forEach(particle => {
            const conditions = this.lorenzSystem.generateInitialConditions(1)[0];
            particle.reset(conditions.x, conditions.y, conditions.z);
        });
    }

    /**
     * Pausa/reanuda el sistema
     */
    togglePause() {
        this.isActive = !this.isActive;
        return this.isActive;
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Particle, ParticleSystem };
}