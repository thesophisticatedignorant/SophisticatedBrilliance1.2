import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

const TapisserieMaterial = shaderMaterial(
  {
    uColor: new THREE.Color('#0a1a2f'), // Deep Royal Blue default
    uHighlight: new THREE.Color('#1c4e80'),
    uGridSize: 20.0,
    uTime: 0
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColor;
    uniform vec3 uHighlight;
    uniform float uGridSize;
    uniform float uTime;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // Helper for high-frequency noise/graining
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.71, 311.7))) * 43758.5453123);
    }

    // Main Tapisserie logic
    float getTapisserieHeight(vec2 uv) {
      vec2 st = uv * uGridSize;
      vec2 tileUv = fract(st) * 2.0 - 1.0;
      
      // Truncated Pyramid Shape
      float d = max(abs(tileUv.x), abs(tileUv.y));
      float pyramid = smoothstep(0.95, 0.4, d);
      
      // Guilloché Graining (Concentric circular grooves)
      // We calculate distance from center of the tile for small circles
      // and from the center of the dial for the overall graining
      float distFromTileCenter = length(tileUv);
      float tileGraining = sin(distFromTileCenter * 150.0) * 0.02;
      
      // Global graining (engine turning effect)
      float globalDist = length(uv - 0.5);
      float globalGraining = sin(globalDist * 800.0) * 0.01;
      
      return pyramid + tileGraining + globalGraining;
    }

    void main() {
      // Procedural Normals for detailed lighting
      float delta = 0.001;
      float h = getTapisserieHeight(vUv);
      float hx = getTapisserieHeight(vUv + vec2(delta, 0.0));
      float hy = getTapisserieHeight(vUv + vec2(0.0, delta));
      
      vec3 normal = normalize(vec3(h - hx, h - hy, delta));
      
      // Transform local normal to world space (approximation)
      vec3 worldNormal = normalize(vNormal + normal * 0.5);
      
      // Lighting
      vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
      float diff = max(dot(worldNormal, lightDir), 0.0);
      
      // Specular (Anisotropic look)
      vec3 viewDir = normalize(-vPosition);
      vec3 halfDir = normalize(lightDir + viewDir);
      float spec = pow(max(dot(worldNormal, halfDir), 0.0), 32.0);
      
      // Color Composition
      vec3 baseColor = mix(uColor * 0.3, uHighlight, h);
      vec3 finalColor = baseColor * (diff * 0.8 + 0.2) + vec3(spec) * 0.5;
      
      // Subtle sparkle/grain
      finalColor += hash(vUv * 1000.0) * 0.02;

      gl_FragColor = vec4(finalColor, 1.0);
      
      // Standard Linear to Gamma conversion
      gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0/2.2));
    }
  `
)

extend({ TapisserieMaterial })



export { TapisserieMaterial }
