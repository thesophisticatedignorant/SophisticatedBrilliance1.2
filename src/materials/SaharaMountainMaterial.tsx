import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { forwardRef, useImperativeHandle, useRef } from 'react'

const SaharaMountainShaderMaterial = shaderMaterial(
    {
        uTime: 0,
        uColorA: new THREE.Color("#8c4b31"), // Red Sandstone
        uColorB: new THREE.Color("#e6c288"), // Gold/Tan Layer
        uColorC: new THREE.Color("#5e2c14"), // Dark Crevice
        uSunDirection: new THREE.Vector3(-0.5, 0.2, -0.5).normalize(),
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vElevation;

    // Pseudo-random function
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // 2D Noise
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

    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec3 pos = position;

        // -- Sandstone Mountain Shape -- 
        // We want blocky, eroded shapes (Mesas/Buttes) mixed with dunes
        
        vec2 posXZ = (modelMatrix * vec4(pos, 1.0)).xz * 0.02; // World scale

        float elevation = 0.0;
        
        // FBM 
        elevation += noise(posXZ * 1.0) * 8.0;
        elevation += noise(posXZ * 2.5) * 4.0;
        
        // Ridged noise for sharp erosion
        float ridge = abs(noise(posXZ * 4.0));
        elevation += (1.0 - ridge) * 3.0;

        // Terracing / Strata effect (Geometric)
        // elevation = floor(elevation * 2.0) / 2.0; // Blocky steps?
        // Let's keep it smoother but steep.
        
        // Power function to make valleys flatter and peaks sharper
        elevation = pow(max(elevation, 0.0), 1.5);
        
        pos.y += elevation * 12.0; 
        
        vElevation = pos.y;

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
    `,
    // Fragment Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vElevation;

    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform vec3 uSunDirection;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float noise(vec2 p) {
        vec2 ip = floor(p);
        vec2 u = fract(p);
        u = u*u*(3.0-2.0*u);
        float res = mix(
            mix(hash(ip), hash(ip+vec2(1.0,0.0)), u.x),
            mix(hash(ip+vec2(0.0,1.0)), hash(ip+vec2(1.0,1.0)), u.x), u.y);
        return res*res;
    }

    void main() {
        // --- 1. Strata (Sedimentary Layers) ---
        // Horizontal bands based on Y height + noise
        float strataNoise = noise(vWorldPosition.xz * 0.2);
        float layer = sin((vWorldPosition.y + strataNoise * 5.0) * 0.5); // Frequency of layers
        
        vec3 rockColor = mix(uColorA, uColorB, smoothstep(-0.5, 0.5, layer));
        
        // Add some thin dark bands (e.g. iron oxide)
        float darkBand = smoothstep(0.9, 0.95, sin(vWorldPosition.y * 3.0 + strataNoise));
        rockColor = mix(rockColor, uColorC, darkBand * 0.5);

        // --- 2. Sand Accumulation ---
        // Flat areas (normals pointing up) get sand
        // float up = dot(vNormal, vec3(0.0, 1.0, 0.0));
        // float sandMix = smoothstep(0.7, 1.0, up); 
        // rockColor = mix(rockColor, uColorB, sandMix * 0.5); // Blend sand on top

        // --- 3. Lighting ---
        // Detail Bump
        float bump = noise(vWorldPosition.xz * 10.0);
        vec3 bumpNormal = normalize(vNormal + vec3(bump * 0.1));
        
        float NdotL = max(dot(bumpNormal, uSunDirection), 0.0);
        float shadow = smoothstep(-0.1, 0.3, NdotL);
        
        // Ambient (Sky/Ground reflection)
        vec3 ambient = uColorB * 0.3;
        
        vec3 diffuse = rockColor * shadow;
        
        // Rim Light (Sun behind mountains)
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float rim = 1.0 - max(dot(viewDir, bumpNormal), 0.0);
        rim = pow(rim, 3.0);
        vec3 rimColor = uColorB * rim * 0.5;

        vec3 finalColor = ambient + diffuse + rimColor;

        gl_FragColor = vec4(finalColor, 1.0);
        
        #include <fog_fragment>
    }
    `
)

extend({ SaharaMountainShaderMaterial })

type SaharaMountainShaderMaterialType = any

declare global {
    namespace JSX {
        interface IntrinsicElements {
            saharaMountainShaderMaterial: SaharaMountainShaderMaterialType
        }
    }
}

export const SaharaMountainMaterial = forwardRef(({ sunPosition }: { sunPosition: [number, number, number] }, ref) => {
    const localRef = useRef<any>(null)
    useImperativeHandle(ref, () => localRef.current)

    useFrame((state) => {
        if (localRef.current) {
            localRef.current.uTime = state.clock.elapsedTime
        }
    })

    const sunDir = new THREE.Vector3(...sunPosition).normalize()

    return (
        <saharaMountainShaderMaterial
            ref={localRef}
            uSunDirection={sunDir}
        />
    )
})
