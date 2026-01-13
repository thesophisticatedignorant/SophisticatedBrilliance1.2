import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import '../materials/TapisserieMaterial'

export function WatchModel(props: any) {
    const materialRef = useRef<THREE.ShaderMaterial>(null)
    const bezelRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
            // Subtle light movement effect
        }
    })

    const goldMaterial = new THREE.MeshStandardMaterial({
        color: "#E5C885", // Champagne gold
        roughness: 0.2,
        metalness: 1.0,
        envMapIntensity: 2,
    })

    const steelMaterial = new THREE.MeshStandardMaterial({
        color: "#C0C0C0",
        roughness: 0.3,
        metalness: 0.9,
    })

    return (
        <group {...props}>
            {/* --- CASE --- */}
            {/* Main Body (Octagonal-ish via cylinder for now, ideally custom shape) */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[1.6, 1.6, 0.4, 8]} />
                <primitive object={goldMaterial} />
            </mesh>

            {/* Bezel (The Iconic Octagon) */}
            <mesh ref={bezelRef} position={[0, 0.25, 0]} rotation={[0, Math.PI / 8, 0]}>
                {/* 8-sided cylinder (octagon) */}
                <cylinderGeometry args={[1.5, 1.5, 0.1, 8]} />
                <primitive object={goldMaterial} />
            </mesh>

            {/* Bezel Screws (8 Hexagonal screws) */}
            {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2 + (Math.PI / 8)
                const r = 1.3
                return (
                    <mesh key={i} position={[Math.sin(angle) * r, 0.31, Math.cos(angle) * r]} rotation={[0, angle, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 0.02, 6]} />
                        <primitive object={steelMaterial} />
                    </mesh>
                )
            })}

            {/* --- DIAL --- */}
            <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1.2, 64]} />
                <tapisserieMaterial
                    ref={materialRef}
                    transparent
                    uColor={new THREE.Color('#0f2045')} // Dark Blue
                    uHighlight={new THREE.Color('#1E3F7D')} // Lighter Blue
                    uGridSize={40.0}
                />
            </mesh>

            {/* --- HANDS --- */}
            {/* Hour */}
            <mesh position={[0, 0.35, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.1, 0.02, 0.8]} />
                <meshStandardMaterial color="#E5C885" metalness={1} roughness={0.1} />
            </mesh>
            {/* Minute */}
            <mesh position={[0, 0.38, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <boxGeometry args={[0.08, 0.02, 1.1]} />
                <meshStandardMaterial color="#E5C885" metalness={1} roughness={0.1} />
            </mesh>

            {/* Glass (Crystal) */}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[1.4, 1.4, 0.05, 32]} />
                <meshPhysicalMaterial
                    transmission={1}
                    thickness={0.5}
                    roughness={0}
                    ior={1.5}
                    color="#ffffff"
                    transparent
                />
            </mesh>
        </group>
    )
}
