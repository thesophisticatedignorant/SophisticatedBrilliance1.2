import { useThree, useFrame } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useMemo } from 'react'

// --- Noise / Height Function (CPU Side) ---

import { getDuneHeight } from '../utils/terrain'

// --- Custom Ripple Shader Injection ---
const rippleShader = {
    uniforms: {
        uTime: { value: 0 }
    },
    onBeforeCompile: (shader: any) => {
        shader.uniforms.uTime = rippleShader.uniforms.uTime

        // ... (rest of shader injection remains similar, omitting for brevity of diff if possible, but tool requires contiguous block. 
        // Actually, since I'm only changing the Javascript logic above and the Mesh position below, I will split into two chunks to avoid re-writing the shader string if I can.)


        // Inject Varying for World Position
        shader.vertexShader = `
            varying vec3 vWorldPosition;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
            '#include <worldpos_vertex>',
            `
            #include <worldpos_vertex>
            vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
            `
        );

        // Add noise function and varying to fragment
        shader.fragmentShader = `
            varying vec3 vWorldPosition;
            uniform float uTime;
            
            float hash2(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f*f*(3.0-2.0*f);
                return mix( mix( hash2( i + vec2(0.0,0.0) ), 
                                 hash2( i + vec2(1.0,0.0) ), u.x),
                            mix( hash2( i + vec2(0.0,1.0) ), 
                                 hash2( i + vec2(1.0,1.0) ), u.x), u.y);
            }
        ` + shader.fragmentShader;

        // Inject normal perturbation in fragment shader
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <normal_fragment_maps>',
            `
            #include <normal_fragment_maps>
            
            // --- DIRECTIONAL WIND RIPPLES ---
            vec2 rippleUV = vWorldPosition.xz * 6.0; // Higher frequency
            
            // Distorted ripple lines
            float windNoise = noise(vWorldPosition.xz * 0.2);
            float rippleVal = sin(rippleUV.x + rippleUV.y * 0.2 + windNoise * 2.0);
            
            // Sharpen ridges
            float ripple = smoothstep(-0.3, 0.3, rippleVal);
            
            // Perturb normal
            vec3 ripplePerturb = vec3(ripple * 0.2, 0.0, ripple * 0.05);
            
            // --- MICRO-GRAIN (Sparkle) ---
            float grainScale = 120.0;
            float grain = hash2(vWorldPosition.xz * grainScale + vec2(0.0, 0.0));
            // Add some "glint"
            float sparkle = step(0.98, grain); 
            
            normal = normalize(normal + ripplePerturb + vec3(grain * 0.05)); 
            
            // --- COLOR VARIATION (Slope based) ---
            // Slip faces (steeper) are darker/redder
            // Windward faces (flatter) are smoother/lighter
            float slope = 1.0 - normal.y;
            vec3 sandA = vec3(0.82, 0.72, 0.55); // Sun-bleached Beige
            vec3 sandB = vec3(0.76, 0.60, 0.40); // Golden Ochre
            vec3 sandC = vec3(0.65, 0.50, 0.35); // Shadowed Redder Sand
            
            // Base color mix
            vec3 mixedColor = mix(sandA, sandB, windNoise * 0.5 + 0.5);
            
            // Darken on slopes
            mixedColor = mix(mixedColor, sandC, smoothstep(0.1, 0.5, slope));
            
            // Apply to diffuse color
            diffuseColor.rgb = mixedColor;
            
            // Add sparkle to roughness (roughness map simulation)
            float rough = 0.9;
            rough -= sparkle * 0.4; // Sparkles are smooth/reflective
            roughnessFactor = rough;
            `
        )
    }
}


export function DesertLandscape() {
    const { scene, gl } = useThree()

    // Sun Position: Low angle for dramatic dune shadows
    const sunPosition: [number, number, number] = [-100, 20, -60]

    useEffect(() => {
        const fogColor = new THREE.Color('#eac899') // Warm haze
        scene.background = fogColor
        scene.fog = new THREE.FogExp2('#eac899', 0.002)

        gl.shadowMap.type = THREE.PCFSoftShadowMap;

        return () => {
            scene.fog = null
        }
    }, [scene, gl])

    // --- GENERATE GEOMETRY ONCE ---
    const duneGeometry = useMemo(() => {
        // High resolution for crisp ridges
        const geo = new THREE.PlaneGeometry(800, 800, 512, 512);
        geo.rotateX(-Math.PI / 2);

        const posAttribute = geo.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);
            vertex.y = getDuneHeight(vertex.x, vertex.z);
            posAttribute.setY(i, vertex.y);
        }
        geo.computeVertexNormals();
        return geo;
    }, [])

    useFrame((state) => {
        rippleShader.uniforms.uTime.value = state.clock.elapsedTime;
    })

    return (
        <group>
            <ambientLight intensity={0.4} color="#d6c0a0" />

            <directionalLight
                position={sunPosition}
                intensity={2.8}
                castShadow
                color="#fff9e6"
                shadow-bias={-0.0005}
                shadow-mapSize={[4096, 4096]}
            >
                <orthographicCamera attach="shadow-camera" args={[-300, 300, 300, -300]} near={1} far={800} />
            </directionalLight>

            <Sky
                distance={450000}
                sunPosition={sunPosition}
                mieCoefficient={0.015} // Hazier
                mieDirectionalG={0.6}
                rayleigh={2.0} // Warmer / Golden
                turbidity={4.0} // Dusty
            />

            {/* DUNES - Self-Shadowing and Textured */}
            <mesh geometry={duneGeometry} receiveShadow castShadow position={[0, -0.3, 0]}>
                <meshStandardMaterial
                    color="#C29B61"
                    roughness={1.0}
                    metalness={0.0}
                    onBeforeCompile={rippleShader.onBeforeCompile}
                />
            </mesh>

            {/* DISTANT MOUNTAINS */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
                <ringGeometry args={[250, 800, 128, 1]} />
                <meshStandardMaterial color="#d4a86a" roughness={1} />
            </mesh>
        </group>
    )
}
