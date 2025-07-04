/**
 * LORENZ-EQUATIONS.JS
 * Implementación de las ecuaciones diferenciales de Lorenz
 * y funciones matemáticas para el atractor
 */

class LorenzSystem {
    constructor(sigma = 10.0, rho = 28.0, beta = 8.0/3.0, dt = 0.01) {
        this.sigma = sigma;  // Prandtl number
        this.rho = rho;      // Rayleigh number
        this.beta = beta;    // Geometric factor
        this.dt = dt;        // Time step
        
        this.stats = {
            iterations: 0,
            maxDistance: 0,
            totalDistance: 0
        };
    }

    /**
     * Calcula el siguiente paso de las ecuaciones de Lorenz
     * dx/dt = σ(y - x)
     * dy/dt = x(ρ - z) - y  
     * dz/dt = xy - βz
     */
    step(particle) {
        const { x, y, z } = particle;
        const { sigma, rho, beta, dt } = this;
        
        // Calcular derivadas
        const dx = sigma * (y - x) * dt;
        const dy = (x * (rho - z) - y) * dt;
        const dz = (x * y - beta * z) * dt;
        
        // Método de Runge-Kutta de 4º orden para mayor precisión
        const k1x = sigma * (y - x);
        const k1y = x * (rho - z) - y;
        const k1z = x * y - beta * z;
        
        const k2x = sigma * ((y + k1y * dt/2) - (x + k1x * dt/2));
        const k2y = (x + k1x * dt/2) * (rho - (z + k1z * dt/2)) - (y + k1y * dt/2);
        const k2z = (x + k1x * dt/2) * (y + k1y * dt/2) - beta * (z + k1z * dt/2);
        
        const k3x = sigma * ((y + k2y * dt/2) - (x + k2x * dt/2));
        const k3y = (x + k2x * dt/2) * (rho - (z + k2z * dt/2)) - (y + k2y * dt/2);
        const k3z = (x + k2x * dt/2) * (y + k2y * dt/2) - beta * (z + k2z * dt/2);
        
        const k4x = sigma * ((y + k3y * dt) - (x + k3x * dt));
        const k4y = (x + k3x * dt) * (rho - (z + k3z * dt)) - (y + k3y * dt);
        const k4z = (x + k3x * dt) * (y + k3y * dt) - beta * (z + k3z * dt);
        
        // Actualizar posición con Runge-Kutta
        particle.x += (k1x + 2*k2x + 2*k3x + k4x) * dt / 6;
        particle.y += (k1y + 2*k2y + 2*k3y + k4y) * dt / 6;
        particle.z += (k1z + 2*k2z + 2*k3z + k4z) * dt / 6;
        
        // Actualizar estadísticas
        this.stats.iterations++;
        const distance = Math.sqrt(particle.x*particle.x + particle.y*particle.y + particle.z*particle.z);
        this.stats.maxDistance = Math.max(this.stats.maxDistance, distance);
        this.stats.totalDistance += distance;
        
        return particle;
    }

    /**
     * Método Euler simple (más rápido, menos preciso)
     */
    stepEuler(particle) {
        const { x, y, z } = particle;
        const { sigma, rho, beta, dt } = this;
        
        const dx = sigma * (y - x) * dt;
        const dy = (x * (rho - z) - y) * dt;
        const dz = (x * y - beta * z) * dt;
        
        particle.x += dx;
        particle.y += dy;
        particle.z += dz;
        
        return particle;
    }

    /**
     * Calcula los puntos de equilibrio del sistema
     */
    getEquilibriumPoints() {
        const { rho, beta } = this;
        
        if (rho <= 1) {
            return [{x: 0, y: 0, z: 0}]; // Solo el origen
        }
        
        const sqrt_term = Math.sqrt(beta * (rho - 1));
        return [
            {x: 0, y: 0, z: 0}, // Origen (inestable)
            {x: sqrt_term, y: sqrt_term, z: rho - 1}, // Punto fijo C+
            {x: -sqrt_term, y: -sqrt_term, z: rho - 1} // Punto fijo C-
        ];
    }

    /**
     * Calcula el exponente de Lyapunov (medida del caos)
     */
    calculateLyapunovExponent(steps = 10000) {
        const epsilon = 1e-8;
        let particle1 = {x: 1, y: 1, z: 1};
        let particle2 = {x: 1 + epsilon, y: 1, z: 1};
        
        let lyapunov = 0;
        
        for (let i = 0; i < steps; i++) {
            this.stepEuler(particle1);
            this.stepEuler(particle2);
            
            const dx = particle2.x - particle1.x;
            const dy = particle2.y - particle1.y;
            const dz = particle2.z - particle1.z;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            if (distance > 0) {
                lyapunov += Math.log(distance / epsilon);
                
                // Renormalizar para evitar overflow
                const factor = epsilon / distance;
                particle2.x = particle1.x + dx * factor;
                particle2.y = particle1.y + dy * factor;
                particle2.z = particle1.z + dz * factor;
            }
        }
        
        return lyapunov / steps / this.dt;
    }

    /**
     * Genera condiciones iniciales interesantes
     */
    generateInitialConditions(count = 5, spread = 0.01) {
        const conditions = [];
        const baseConditions = [
            {x: 1, y: 1, z: 1},
            {x: -1, y: -1, z: 1},
            {x: 1, y: -1, z: 1},
            {x: -1, y: 1, z: 1},
            {x: 0, y: 1, z: 1}
        ];
        
        for (let i = 0; i < count; i++) {
            const base = baseConditions[i % baseConditions.length];
            conditions.push({
                x: base.x + (Math.random() - 0.5) * spread,
                y: base.y + (Math.random() - 0.5) * spread,
                z: base.z + (Math.random() - 0.5) * spread
            });
        }
        
        return conditions;
    }

    /**
     * Proyección 3D a 2D con rotación
     */
    project3Dto2D(x, y, z, rotationX = 0, rotationY = 0, scale = 8, centerX = 400, centerY = 300) {
        // Rotación en Y
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        const rotatedX = x * cosY - z * sinY;
        const rotatedZ = x * sinY + z * cosY;
        
        // Rotación en X
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const finalY = y * cosX - rotatedZ * sinX;
        const finalZ = y * sinX + rotatedZ * cosX;
        
        // Proyección perspectiva
        const perspective = 500 / (500 + finalZ);
        
        return {
            x: centerX + rotatedX * scale * perspective,
            y: centerY - finalY * scale * perspective,
            z: finalZ
        };
    }

    /**
     * Detecta si el sistema está en una región específica del atractor
     */
    detectAttractorRegion(x, y, z) {
        const distance = Math.sqrt(x*x + y*y + z*z);
        
        if (distance < 5) return 'center';
        if (x > 0 && z > 20) return 'right_wing';
        if (x < 0 && z > 20) return 'left_wing';
        if (z < 10) return 'transition';
        
        return 'unknown';
    }

    /**
     * Actualiza los parámetros del sistema
     */
    updateParameters(sigma, rho, beta) {
        this.sigma = sigma || this.sigma;
        this.rho = rho || this.rho;
        this.beta = beta || this.beta;
        
        // Resetear estadísticas
        this.stats = {
            iterations: 0,
            maxDistance: 0,
            totalDistance: 0
        };
    }

    /**
     * Obtiene información del sistema actual
     */
    getSystemInfo() {
        return {
            parameters: {
                sigma: this.sigma,
                rho: this.rho,
                beta: this.beta,
                dt: this.dt
            },
            stats: { ...this.stats },
            equilibriumPoints: this.getEquilibriumPoints(),
            isChaotic: this.rho > 24.74, // Aproximación
            attractorType: this.rho > 24.74 ? 'Strange Attractor' : 'Fixed Point'
        };
    }
}

// Utilidades matemáticas adicionales
const MathUtils = {
    /**
     * Interpolación suave entre dos valores
     */
    lerp: (a, b, t) => a + (b - a) * t,
    
    /**
     * Suavizado exponencial
     */
    smoothstep: (edge0, edge1, x) => {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    },
    
    /**
     * Mapea un valor de un rango a otro
     */
    map: (value, inMin, inMax, outMin, outMax) => {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },
    
    /**
     * Genera colores basados en posición en el atractor
     */
    getAttractorColor: (x, y, z, time = 0) => {
        const hue = (Math.atan2(y, x) * 180 / Math.PI + 180 + time * 0.5) % 360;
        const saturation = Math.min(100, Math.max(50, z * 2));
        const lightness = Math.min(80, Math.max(40, 60 + Math.sin(time * 0.01) * 20));
        
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LorenzSystem, MathUtils };
}// JavaScript Document