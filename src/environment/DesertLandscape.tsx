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

        // Inject Varying for World Position
        shader.vertexShader = `
            varying vec3 vWorldPosition;
            varying float vDist;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
            '#include <worldpos_vertex>',
            `
            #include <worldpos_vertex>
            vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
            vDist = length(cameraPosition - vWorldPosition); // Distance for LOD/Fade
            `
        );

        // Add noise function and varying to fragment
        shader.fragmentShader = `
            varying vec3 vWorldPosition;
            varying float vDist;
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
            
            // --- DIRECTIONAL WIND RIPPLES (Asymmetric) ---
            // Higher frequency for small scale ripples
            vec2 rippleUV = vWorldPosition.xz * 12.0; 
            
            // Distorted ripple lines (wind variation)
            float windNoise = noise(vWorldPosition.xz * 0.15);
            
            // Asymmetric Wave (Sawtooth-like)
            // exp(sin(x)) gives sharper peaks and wider troughs
            float rippleVal = sin(rippleUV.x + rippleUV.y * 0.3 + windNoise * 2.5);
            float sharpRipple = exp(rippleVal) - 1.0; // Sharpen peaks
            
            // --- MICRO-GRAIN (Sparkle/Texture) ---
            float grainScale = 350.0;
            float grain = hash2(vWorldPosition.xz * grainScale);
            float sparkle = step(0.97, grain); // Occasional glint
            
            // --- DISTANCE FADE (LOD) ---
            // Fade out ripples and grain in distance to reduce moire/noise
            float distFactor = smoothstep(50.0, 10.0, vDist); // Fade out past 50m
            
            vec3 ripplePerturb = vec3(sharpRipple * 0.15 * distFactor, 0.0, sharpRipple * 0.05 * distFactor);
            vec3 grainPerturb = vec3((grain - 0.5) * 0.1 * distFactor); /* Micro rough */
            
            normal = normalize(normal + ripplePerturb + grainPerturb);
            
            // --- COLOR VARIATION ---
            float slope = 1.0 - normal.y;
            vec3 sandA = vec3(0.82, 0.72, 0.55); // Sun-bleached Beige (Highlight)
            vec3 sandB = vec3(0.76, 0.60, 0.40); // Golden Ochre (Mid)
            vec3 sandC = vec3(0.65, 0.50, 0.35); // Shadowed Redder Sand
            
            // Windward vs Leeward color
            // Wind coming roughly from X direction
            float windFacing = dot(normal, normalize(vec3(1.0, 0.2, 0.5)));
            
            vec3 mixedColor = mix(sandB, sandA, smoothstep(0.0, 1.0, windFacing)); // Lighten windward
            mixedColor = mix(mixedColor, sandC, smoothstep(0.2, 0.6, slope)); // Darken slopes
            
            diffuseColor.rgb = mixedColor;
            
            // Add sparkle to roughness
            float rough = 0.95;
            rough -= sparkle * 0.5 * distFactor; // Sparkles
            roughnessFactor = rough;
            `
        )
    }
}


export function DesertLandscape() {
    const { scene, gl } = useThree()

    // Sun Position: High Front-Right
    // Positioned at [50, 25, 80] relative to camera at [0, 15, 45]
    // This ensures light comes from "behind/right" of the viewer, casting shadows forward-left
    // clearing the foreground of dune shadows.
    const sunPosition: [number, number, number] = [60, 25, 80]

    useEffect(() => {
        // Late Golden Hour: Deep oranges and purples/blues in the distance
        const fogColor = new THREE.Color('#ffaa55').lerp(new THREE.Color('#334466'), 0.15)
        scene.background = fogColor
        scene.fog = new THREE.FogExp2(fogColor.getHexString(), 0.0015) // Slightly less dense to see bloom

        gl.shadowMap.type = THREE.PCFSoftShadowMap;

        return () => {
            scene.fog = null
        }
    }, [scene, gl])

    // --- GENERATE GEOMETRY ONCE ---
    const duneGeometry = useMemo(() => {
        // High resolution for crisp ridges
        // Increased geometry size to handle the pushed back dunes better visually
        const geo = new THREE.PlaneGeometry(1000, 1000, 512, 512);
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
            {/* Cool Blue Shadows (Ambient) - Increased slightly for better visibility in shadows */}
            <ambientLight intensity={0.4} color="#667799" />

            {/* Warm Golden Sunlight - Raking light */}
            <directionalLight
                position={sunPosition}
                intensity={4.5} // Intense low sun
                castShadow
                color="#ffaa33"
                shadow-bias={-0.0005} // Adjusted bias
                shadow-mapSize={[4096, 4096]}
            >
                <orthographicCamera attach="shadow-camera" args={[-400, 400, 400, -400]} near={1} far={1200} />
            </directionalLight>

            <Sky
                distance={450000}
                sunPosition={sunPosition}
                mieCoefficient={0.01} // Clearer air
                mieDirectionalG={0.9} // Stronger sun glow
                rayleigh={4.0} // Deeper evening blue
                turbidity={8.0}
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

            {/* GROUND OCCLUSION PLANE - Prevents seeing under the world or floating edges */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.0, 0]}>
                <circleGeometry args={[2000, 32]} />
                <meshBasicMaterial color="#667799" /> {/* Matches shadow/ambient color */}
            </mesh>
        </group>
    )
}
