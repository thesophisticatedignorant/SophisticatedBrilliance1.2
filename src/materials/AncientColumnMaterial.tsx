import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { forwardRef, useImperativeHandle, useRef } from 'react'

const AncientColumnShaderMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color("#f2f0e6"), // Marble Base
        uDecayColor: new THREE.Color("#5d5b55"), // Dark eroded stone
        uFluteFrequency: 20.0,
        uFluteDepth: 0.02,
        uDecayScale: 2.5,
        uDecayThreshold: 0.45, // How much is eroded
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vDecayValue;

    uniform float uFluteFrequency;
    uniform float uFluteDepth;
    uniform float uDecayScale;
    uniform float uTime;

    // --- Simplex 3D Noise ---
    vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289v4(((x*34.0)+1.0)*x); }
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

        //   x0 = x0 - 0.0 + 0.0 * C.xxx;
        //   x1 = x0 - i1  + 1.0 * C.xxx;
        //   x2 = x0 - i2  + 2.0 * C.xxx;
        //   x3 = x0 - 1.0 + 3.0 * C.xxx;
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
        vec3 x3 = x0 - 1.0 + C.zzz; // 3.0*C.x = 1/2 = C.z

        // Permutations
        i = mod289v3(i); 
        vec4 p = permute( permute( permute( 
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        // Gradients: 7x7 points over a square, mapped onto an octahedron.
        // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
        float n_ = 0.142857142857; // 1.0/7.0
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
        //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);

        //Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                      dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
        vUv = uv;
        vec3 pos = position;
        
        // --- 1. Flutes (Vertical Grooves) ---
        float flute = -cos(uv.x * uFluteFrequency * 6.28318);
        flute = flute * 0.5 + 0.5; // 0 to 1
        
        float sideMask = 1.0 - abs(normal.y);
        sideMask = smoothstep(0.8, 0.9, sideMask); 

        vec3 displacement = normal * (flute * -uFluteDepth * sideMask);
        pos += displacement;

        // --- 2. Decay/Damage Calculation ---
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;
        
        float noiseVal = snoise(worldPos.xyz * uDecayScale);
        vDecayValue = noiseVal; 
        
        gl_Position = projectionMatrix * viewMatrix * worldPos;
        vNormal = normalMatrix * normal; 
    }
    `,
    // Fragment Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vDecayValue;

    uniform vec3 uColor;
    uniform vec3 uDecayColor;
    uniform float uDecayThreshold;

    void main() {
        vec3 baseColor = uColor;

        // --- Decay Check ---
        // If really decayed, discard to make a hole
        if (vDecayValue > uDecayThreshold + 0.15) {
             discard;
        } 
        
        // Apply shallow decay color edge
        float decayMix = smoothstep(uDecayThreshold - 0.1, uDecayThreshold + 0.15, vDecayValue);
        baseColor = mix(baseColor, uDecayColor, decayMix);

        // --- Lighting ---
        vec3 lightDir = normalize(vec3(-0.5, 0.4, -0.8));
        vec3 normal = normalize(vNormal);

        // Fake flute normals using derivatives of UV.x
        // We can just add a bit of perturbation based on position x
        // But let's keep it simple for now, the vertex displacement helps
        
        float diff = max(dot(normal, lightDir), 0.0);
        float ambient = 0.35;
        
        vec3 finalColor = baseColor * (diff + ambient);

        // Add stone grain
        float grain = fract(sin(dot(vUv * 50.0, vec2(12.9898,78.233))) * 43758.5453);
        finalColor *= (0.92 + 0.16 * grain);

        gl_FragColor = vec4(finalColor, 1.0);
        
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
            uDecayScale={props.decayScale || 2.5}
            {...props}
        />
    )
})
