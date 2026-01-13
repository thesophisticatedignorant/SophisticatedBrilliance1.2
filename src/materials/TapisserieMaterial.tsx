import { shaderMaterial } from '@react-three/drei'
import { extend, ReactThreeFiber } from '@react-three/fiber'
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
    
    varying vec2 vUv;
    varying vec3 vNormal;

    // Function to create the raised square "pyramid" shape pattern
    float tapisseriePattern(vec2 uv, float grid) {
      vec2 tile = fract(uv * grid) * 2.0 - 1.0;
      float d = max(abs(tile.x), abs(tile.y));
      
      // Create the beveled edge effect (truncated pyramid)
      float height = smoothstep(0.8, 0.4, d);
      
      // Add a subtle "swirl" or noise texture on top for realism would go here
      return height;
    }

    void main() {
      // Base pattern
      float pattern = tapisseriePattern(vUv, uGridSize);
      
      // Lighting simulation (simple faux-anisotropy based on normal)
      float light = dot(vNormal, vec3(0.0, 1.0, 1.0)) * 0.5 + 0.5;
      
      // Mix colors based on height/pattern for the guilloché look
      vec3 finalColor = mix(uColor * 0.5, uHighlight, pattern * light);
      
      // Add metallic sheen
      float metallic = 0.6;
      finalColor += vec3(0.1) * metallic * pattern;

      gl_FragColor = vec4(finalColor, 1.0);
      
      // Simple tone mapping
      gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0/2.2));
    }
  `
)

extend({ TapisserieMaterial })



export { TapisserieMaterial }
