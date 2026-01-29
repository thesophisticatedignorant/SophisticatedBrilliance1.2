import { useRef, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import '../materials/TapisserieMaterial'

const goldMaterial = new THREE.MeshStandardMaterial({
    color: "#E5C885", // Champagne gold
    roughness: 0.15,
    metalness: 1.0,
    envMapIntensity: 2.5,
})

const steelMaterial = new THREE.MeshStandardMaterial({
    color: "#d1d5db",
    roughness: 0.2,
    metalness: 0.9,
    envMapIntensity: 1.5,
})

const handMaterial = new THREE.MeshStandardMaterial({
    color: "#E5C885",
    metalness: 1,
    roughness: 0.1,
    envMapIntensity: 2
})

export const WatchModel = forwardRef((props: any, ref) => {
    const materialRef = useRef<THREE.ShaderMaterial>(null)
    const bezelRef = useRef<THREE.Mesh>(null)

    // Anchor Refs
    const anchorMaterial = useRef<THREE.Group>(null)
    const anchorDial = useRef<THREE.Group>(null)
    const anchorCalibre = useRef<THREE.Group>(null)

    useImperativeHandle(ref, () => ({
        getAnchors: () => ({
            material: anchorMaterial.current,
            dial: anchorDial.current,
            calibre: anchorCalibre.current
        })
    }))

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
        }
    })

    return (
        <group {...props}>
            {/* --- ANCHORS --- */}
            <group ref={anchorMaterial} position={[1.5, 0, 0]} />
            <group ref={anchorDial} position={[0, 0.4, 0.5]} />
            <group ref={anchorCalibre} position={[-1.2, 0, 0]} />

            {/* --- CASE --- */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[1.6, 1.6, 0.4, 8]} />
                <primitive object={goldMaterial} />
            </mesh>

            {/* Bezel */}
            <mesh ref={bezelRef} position={[0, 0.25, 0]} rotation={[0, Math.PI / 8, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 0.1, 8]} />
                <primitive object={goldMaterial} />
            </mesh>

            {/* Bezel Screws */}
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
                    uColor={new THREE.Color('#0f2045')}
                    uHighlight={new THREE.Color('#1E3F7D')}
                    uGridSize={40.0}
                />
            </mesh>

            {/* --- HANDS --- */}
            <mesh position={[0, 0.35, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.1, 0.02, 0.8]} />
                <primitive object={handMaterial} />
            </mesh>
            <mesh position={[0, 0.38, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <boxGeometry args={[0.08, 0.02, 1.1]} />
                <primitive object={handMaterial} />
            </mesh>

            {/* Glass */}
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
})
