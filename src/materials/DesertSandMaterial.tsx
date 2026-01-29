import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { forwardRef, useImperativeHandle, useRef } from 'react'

const DesertSandShaderMaterial = shaderMaterial(
    {
        uTime: 0,
        uColorA: new THREE.Color("#e6c288"),
        uColorB: new THREE.Color("#b88a57"),
        uColorC: new THREE.Color("#ffdb99"),
        uDisplacementStrength: 25.0, // Increased for drama
        uNoiseScale: 1.0,

        // Macro Topography Uniforms (Dunes)
        uMacroHeight: 15.0,
        uMacroScale: 0.15,

        uSunDirection: new THREE.Vector3(-0.5, 0.2, -0.5).normalize(),
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vDisplacement;
    varying float vElevation; // Total height

    uniform float uDisplacementStrength;
    uniform float uNoiseScale;
    uniform float uMacroHeight;
    uniform float uMacroScale;

    // --- Noise Functions ---
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    // Function to calculate Macro Topography (Dunes)
    // "Sahara" style: Sharp ridges, sweeping curves.
    float getDuneHeight(vec2 worldXZ) {
        
        // 1. Primary "Hero" Ridge (Right Side)
        float rightBias = smoothstep(-20.0, 50.0, worldXZ.x); 
        
        // Use WorldXZ for noise
        // Scale needs to be appropriate for world units (1 unit = 1 meter approx)
        float n1 = noise(worldXZ * uMacroScale); 
        float ridge1 = 1.0 - abs(2.0 * n1 - 1.0); 
        ridge1 = pow(ridge1, 4.0); 
        
        // Hero Dune Shape - Moved MUCH closer (Hero peak at X=35)
        float heroDune = exp(-pow((worldXZ.x - 35.0) * 0.04, 2.0)); 
        heroDune *= smoothstep(-20.0, 50.0, worldXZ.z + 50.0); 
        
        float h = (ridge1 * 0.5 + heroDune * 2.0) * uMacroHeight;

        // 2. Rolling features everywhere else
        float n2 = noise(worldXZ * uMacroScale * 1.5 + vec2(43.0, 12.0));
        float ridge2 = 1.0 - abs(2.0 * n2 - 1.0);
        h += ridge2 * uMacroHeight * 0.3;

        // 3. Central Abyss / Flat Stage
        float dist = length(worldXZ);
        // Start flattening closer (radius 6-40 range) to match the tight camera view
        float flattenParams = smoothstep(6.0, 40.0, dist); 
        
        return h * flattenParams;
    }

    void main() {
        vUv = uv;
        vec3 pos = position;
        
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;

        // 1. Calculate Macro Dune Height
        float macroHeight = getDuneHeight(vWorldPosition.xz); 
        
        // 2. Micro-Displacement (Wind Ripples in Geometry)
        vec2 rippleUv = uv * 30.0 * uNoiseScale;
        float ripple = sin(rippleUv.y + noise(rippleUv * 0.1) * 2.0);
        ripple = ripple * 0.5 + 0.5;
        float microDisplacement = ripple * 0.35 * uDisplacementStrength * 0.05; 

        // Total Displacement
        float totalHeight = macroHeight + microDisplacement;
        pos.y += totalHeight; 

        // Update varied world pos for fragment
        worldPos.y += totalHeight; 
        vWorldPosition = worldPos.xyz;
        vElevation = totalHeight;
        vDisplacement = microDisplacement; 

        // 3. Recalculate Normals (Finite Difference)
        // Use a consistent step size in World Units
        float epsilon = 0.1; 
        float hCenter = macroHeight; 
        // We only care about macro height for the main shape normals
        float hRight  = getDuneHeight(vWorldPosition.xz + vec2(epsilon, 0.0));
        float hUp     = getDuneHeight(vWorldPosition.xz + vec2(0.0, epsilon));

        vec3 tangentX = normalize(vec3(epsilon, hRight - hCenter, 0.0)); 
        vec3 tangentZ = normalize(vec3(0.0, hUp - hCenter, epsilon));

        vec3 perturbedNormal = normalize(cross(tangentZ, tangentX));
        vNormal = normalize(normalMatrix * perturbedNormal);

        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
    `,
    // Fragment Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vDisplacement;
    varying float vElevation;

    uniform vec3 uColorA; // Shadow (Purple/Brown)
    uniform vec3 uColorB; // Mid (Orange/Gold)
    uniform vec3 uColorC; // Highlight (Pale Gold)
    uniform vec3 uSunDirection;

    // --- Noise Functions ---
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
        }
        return value;
    }

    void main() {
        // --- Base Color Mixing based on Height & Normal ---
        // Steeper slopes away from sun get darker color A
        float slope = 1.0 - vNormal.y; 
        vec3 baseColor = mix(uColorB, uColorA, slope * 0.5);
        
        // Height gradient (valleys darker)
        baseColor = mix(baseColor, uColorA, smoothstep(5.0, -2.0, vElevation) * 0.4);

        // --- Fine Wind Ripples (Normal Map Simulation) ---
        // High frequency ripples
        vec2 ripplePos = vWorldPosition.xz * 8.0; 
        float rippleWarp = noise(vWorldPosition.xz * 0.5);
        ripplePos += rippleWarp * 2.0;
        
        float ripplePattern = sin(ripplePos.x + ripplePos.y * 0.2);
        ripplePattern = smoothstep(-0.2, 0.2, ripplePattern); // Sharpen
        
        // Modulate normal slightly based on ripples
        vec3 microNormal = vNormal;
        microNormal.x += ripplePattern * 0.15;
        microNormal = normalize(microNormal);

        // --- Sand Grain Texture ---
        float grain = fbm(vWorldPosition.xz * 80.0);
        baseColor *= (0.8 + 0.4 * grain); // Contrast grain

        // --- Lighting ---
        float NdotL = max(dot(microNormal, uSunDirection), 0.0);
        
        // Sharp Terminator for Dunes
        float shadow = smoothstep(-0.1, 0.1, NdotL); 
        
        vec3 diffuse = baseColor * shadow;
        
        // Ambient Skylight (blue-ish in shadows)
        vec3 ambient = vec3(0.1, 0.1, 0.25) * (1.0 - shadow) * 0.5;
        ambient += uColorB * 0.2;

        // Specular Sparkles (Sand Grains)
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfVector = normalize(uSunDirection + viewDir);
        float NdotH = max(dot(microNormal, halfVector), 0.0);
        float sparkle = pow(NdotH, 20.0) * step(0.65, grain) * shadow * 2.0;

        // Rim Light (Sun Backlight)
        float rim = pow(1.0 - max(dot(viewDir, microNormal), 0.0), 4.0);
        vec3 rimColor = uColorC * rim * shadow * 0.5;

        vec3 finalColor = ambient + diffuse + vec3(sparkle) + rimColor;

        // DEBUG: Visualize Normals
        // gl_FragColor = vec4(finalColor, 1.0);
        gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);
        
        #include <fog_fragment>
    }
    `
)

extend({ DesertSandShaderMaterial })

type DesertSandShaderMaterialType = any

declare global {
    namespace JSX {
        desertSandShaderMaterial: any
    }
}

export const DesertSandMaterial = forwardRef(({
    sunPosition,
    COLORS,
    displacementStrength = 25.0,
    noiseScale = 1.0,
    macroHeight = 15.0,
    macroScale = 0.15,
}: {
    sunPosition: [number, number, number],
    COLORS: any,
    displacementStrength?: number,
    noiseScale?: number,
    macroHeight?: number,
    macroScale?: number
}, ref) => {
    const localRef = useRef<any>(null)
    useImperativeHandle(ref, () => localRef.current)

    useFrame((state) => {
        if (localRef.current) {
            localRef.current.uTime = state.clock.elapsedTime
        }
    })

    const sunDir = new THREE.Vector3(...sunPosition).normalize()

    return (
        <desertSandShaderMaterial
            ref={localRef}
            uSunDirection={sunDir}
            uColorA={new THREE.Color(COLORS.shadow)}
            uColorB={new THREE.Color(COLORS.mid)}
            uColorC={new THREE.Color(COLORS.highlight)}
            uDisplacementStrength={displacementStrength}
            uNoiseScale={noiseScale}
            uMacroHeight={macroHeight}
            uMacroScale={macroScale}
        />
    )
})

