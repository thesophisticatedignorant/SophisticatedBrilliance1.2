
import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { forwardRef, useImperativeHandle, useRef } from 'react'


const AncientColumnShaderMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color("#dccca3"), // Warm Travertine Base
        uDecayColor: new THREE.Color("#5d5b55"), // Dark eroded stone/crevices
        uSandColor: new THREE.Color("#e6a65c"), // Warm Sahara Sand
        uFluteFrequency: 20.0,
        uFluteDepth: 0.02,
        uEntasisStrength: 0.15, // How much it swells
        uWindDirection: new THREE.Vector3(0.8, 0.0, 0.6), // Direction of wind weathering
        uSandLevel: 0.0, // Base level of sand burial
        uErosionStrength: 1.0, // 1.0 = Ancient/Weathered, 0.0 = Restored/New
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vNoiseVal;
    varying float vHeight;

    uniform float uFluteFrequency;
    uniform float uFluteDepth;
    uniform float uEntasisStrength;
    uniform float uTime;
    uniform float uErosionStrength;

    // --- Simplex 3D Noise ---
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

        // First corner
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;

        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - 1.0 + C.yyy; 

        // Permutations
        i = mod289(i); 
        vec4 p = permute( permute( permute( 
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        float n_ = 0.142857142857; // 1.0/7.0
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z); 

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ ); 

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                      dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
        vUv = uv;
        vec3 pos = position;
        vHeight = uv.y; // 0 at bottom, 1 at top

        // --- 1. Entasis (Classical Swelling) ---
        float swelling = sin(uv.y * 3.14159) * uEntasisStrength;
        float isSide = smoothstep(0.9, 0.5, abs(normal.y));
        pos.xz += normalize(pos.xz) * swelling * isSide;


        // --- 2. Flutes (Vertical Grooves) ---
        float flute = -cos(uv.x * uFluteFrequency * 6.28318);
        flute = flute * 0.5 + 0.5;
        
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        
        // --- 3. HARD CHIPPED EROSION ---
        // High frequency noise for "chips"
        float chipNoise = snoise(worldPos.xyz * 15.0); 
        
        // Use smoothstep with narrow range to create sharp "cliff" edges
        // If noise < -0.2 -> Deep chip
        // If noise > -0.2 -> Surface
        float chip = smoothstep(-0.3, -0.2, chipNoise);
        
        // Apply flute displacement (masked by chips - chips cut into flutes)
        float fluteMask = smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.9, uv.y);
        vec3 fluteDisp = normal * (flute * -uFluteDepth * isSide * fluteMask);
        
        // Displacement: push INWARDS where chipped
        // (1.0 - chip) is 1.0 in chipped areas
        vec3 chipDisp = normal * (-(1.0 - chip) * 0.05 * uErosionStrength);

        // Add large scale wobble for ancient warping
        float wobble = snoise(worldPos.xyz * 2.0);
        vec3 wobbleDisp = normal * (wobble * 0.02 * uErosionStrength);

        pos += fluteDisp + chipDisp + wobbleDisp;

        vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
        vNoiseVal = chipNoise; // Pass for fragment to color chips darker

        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
        vNormal = normalMatrix * normal;
    }
    `,
    // Fragment Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vNoiseVal; // Chip noise
    varying float vHeight;

    uniform vec3 uColor;
    uniform vec3 uDecayColor;
    uniform vec3 uSandColor;
    uniform vec3 uWindDirection;
    uniform float uTime;
    uniform float uErosionStrength;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float vnoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(mix(hash(i.xy + vec2(0,0) + i.z*vec2(17,17).x), hash(i.xy + vec2(1,0) + i.z*vec2(17,17).x), f.x),
                mix(hash(i.xy + vec2(0,1) + i.z*vec2(17,17).x), hash(i.xy + vec2(1,1) + i.z*vec2(17,17).x), f.x), f.y),
            mix(mix(hash(i.xy + vec2(0,0) + (i.z+1.0)*vec2(17,17).x), hash(i.xy + vec2(1,0) + (i.z+1.0)*vec2(17,17).x), f.x),
                mix(hash(i.xy + vec2(0,1) + (i.z+1.0)*vec2(17,17).x), hash(i.xy + vec2(1,1) + (i.z+1.0)*vec2(17,17).x), f.x), f.y), f.z);
    }

    void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 lightDir = normalize(vec3(-0.8, 0.4, -0.6)); // Match sun pos roughly

        // --- 1. Base Travertine Texture ---
        float n1 = vnoise(vWorldPosition * 30.0); // Fine grain
        float n2 = vnoise(vWorldPosition * 6.0);  // Macro variation
        
        // --- 2. Patina / Crevices ---
        // Use vNoiseVal from vertex (chip depth)
        // If vNoiseVal was low (chipped), we are deep -> darker/dirtier
        // But also add high freq noise for surface patina
        
        float deepChip = 1.0 - smoothstep(-0.35, -0.15, vNoiseVal); // 1.0 inside chips
        
        vec3 albedo = uColor;
        
        // Variation
        albedo = mix(albedo, uColor * 0.9, n2);
        
        // Patina accumulation in chips & crevices
        // Mix uDecayColor based on chip depth and some noise
        float dirt = deepChip * 0.8 + (1.0 - n1) * 0.2;
        albedo = mix(albedo, uDecayColor, dirt * uErosionStrength);

        // --- 3. Sand Accumulation ---
        // Upward facing planes
        float upFactor = max(dot(normal, vec3(0.0, 1.0, 0.0)), 0.0);
        
        // Sand on top of chips/ledges
        float ledgeSand = smoothstep(0.5, 0.9, upFactor) * step(0.1, deepChip); // Sand sitting in chips?
        
        // Base burial
        float baseSand = smoothstep(0.2, 0.0, vUv.y);
        
        float totalSand = max(ledgeSand, baseSand);
        albedo = mix(albedo, uSandColor, totalSand * 0.9);

        // --- 4. Lighting ---
        float diff = max(dot(normal, lightDir), 0.0);
        
        // Specular is low for stone
        float roughness = 0.95;
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0) * (1.0 - roughness);
        
        vec3 ambient = vec3(0.4) * albedo; // Blue-ish tint from env ideally, here just dim
        vec3 diffuse = diff * albedo * vec3(1.0, 0.95, 0.85);
        
        gl_FragColor = vec4(ambient + diffuse + vec3(spec), 1.0);
        
        #include <fog_fragment>
    }
    `
)

extend({ AncientColumnShaderMaterial })

type AncientColumnShaderMaterialType = any

declare global {
    namespace JSX {
        interface IntrinsicElements {
            ancientColumnShaderMaterial: AncientColumnShaderMaterialType
        }
    }
}

export const AncientColumnMaterial = forwardRef((props: any, ref) => {
    const localRef = useRef<any>(null)
    useImperativeHandle(ref, () => localRef.current)

    useFrame((state) => {
        if (localRef.current) {
            localRef.current.uTime = state.clock.elapsedTime
        }
    })

    return (
        <ancientColumnShaderMaterial
            ref={localRef}
            uFluteFrequency={props.fluteFreq || 20.0}
            uEntasisStrength={props.uEntasisStrength !== undefined ? props.uEntasisStrength : 0.15}
            {...props}
            uErosionStrength={props.uErosionStrength !== undefined ? props.uErosionStrength : 1.0}
        />
    )
})
