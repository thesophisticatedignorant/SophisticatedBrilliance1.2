import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { WatchModel } from '../components/WatchModel'
import { useStore } from '../store/useStore'
import { easing } from 'maath'
import { ASSETS } from '../config/assets'

function InteractiveWatch({ asset, isFocused, setView, setFocusedObject, setAnchorPosition }: any) {
    const ref = useRef<THREE.Group>(null)
    const modelRef = useRef<any>(null)
    const rotationRef = useRef({ x: 0, y: 0 })
    const isDragging = useRef(false)
    const lastPos = useRef({ x: 0, y: 0 })
    const { camera, size } = useThree()

    useFrame((state, delta) => {
        if (ref.current) {
            // Levitation Logic: Only if this SPECIFIC asset is focused
            const targetY = isFocused ? 3.5 : asset.position[1]

            // Damp to target Y, keeping X and Z fixed from config
            easing.damp3(ref.current.position, [asset.position[0], targetY, asset.position[2]], 0.5, delta)

            // Rotation Logic
            if (isFocused) {
                // Apply manual rotation (Tumble)
                ref.current.rotation.y = asset.rotation[1] + rotationRef.current.y
                ref.current.rotation.x = asset.rotation[0] + rotationRef.current.x

                // --- ANCHOR PROJECTION ---
                if (modelRef.current) {
                    const anchors = modelRef.current.getAnchors()
                    if (anchors) {
                        const projectAnchor = (obj: THREE.Object3D, key: string) => {
                            if (!obj) return
                            const v = new THREE.Vector3()
                            obj.getWorldPosition(v)
                            v.project(camera)
                            const x = (v.x * 0.5 + 0.5) * size.width
                            const y = (-(v.y * 0.5) + 0.5) * size.height
                            setAnchorPosition(key, { x, y })
                        }

                        projectAnchor(anchors.material, 'material')
                        projectAnchor(anchors.dial, 'dial')
                        projectAnchor(anchors.calibre, 'calibre')
                    }
                }

            } else {
                // Damp back to original rotation
                easing.dampE(ref.current.rotation, asset.rotation, 0.5, delta)
                // Reset rotation accumulator
                rotationRef.current = { x: 0, y: 0 }
            }
        }
    })

    const handlePointerDown = (e: any) => {
        if (!isFocused) return
        e.stopPropagation()
        isDragging.current = true
        lastPos.current = { x: e.screenX, y: e.screenY }
        // Capture pointer to track outside the mesh
        e.target.setPointerCapture(e.pointerId)
    }

    const handlePointerUp = (e: any) => {
        if (!isFocused) return
        e.stopPropagation()
        isDragging.current = false
        e.target.releasePointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: any) => {
        if (isFocused && isDragging.current) {
            e.stopPropagation()
            const dx = e.screenX - lastPos.current.x
            const dy = e.screenY - lastPos.current.y

            rotationRef.current.y += dx * 0.005
            rotationRef.current.x += dy * 0.005

            lastPos.current = { x: e.screenX, y: e.screenY }
        }
    }

    return (
        <group
            ref={ref}
            position={asset.position}
            rotation={asset.rotation}
            onClick={(e) => {
                e.stopPropagation()
                setFocusedObject(asset.id)
                setView('PRODUCT')
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            <WatchModel ref={modelRef} scale={0.5} />
            <mesh
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerMove={handlePointerMove}
            >
                <boxGeometry args={[2, 2, 2]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
            {/* Label attached to the asset? Or floating above? */}
        </group>
    )
}

export function APFamilyRoom() {
    const setView = useStore((state) => state.setView)
    const viewState = useStore((state) => state.viewState)
    const focusedObjectId = useStore((state) => state.focusedObjectId)
    const setFocusedObject = useStore((state) => state.setFocusedObject)

    const marbleMaterial = new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.1,
        metalness: 0.1,
    })

    const darkMaterial = new THREE.MeshStandardMaterial({
        color: "#111111",
        roughness: 0.8,
        metalness: 0.2,
    })

    return (
        <group>
            {/* Floor - Large Dark Surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <primitive object={darkMaterial} />
            </mesh>

            {/* Reflective Center Stage */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <circleGeometry args={[4, 64]} />
                <meshStandardMaterial
                    color="#0a0a0a"
                    roughness={0}
                    metalness={0.8}
                    envMapIntensity={2}
                />
            </mesh>

            {/* Pillars - 5 Perimeter + 1 Center Base */}
            {/* Center Podium - Flattened to avoid obstruction */}
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.8, 0.8, 0.2, 64]} />
                <primitive object={marbleMaterial} />
            </mesh>

            {/* Perimeter Pillars */}
            {[...Array(5)].map((_, i) => {
                const angle = (i / 5) * Math.PI * 2
                const x = Math.sin(angle) * 3.5
                const z = Math.cos(angle) * 3.5
                return (
                    <mesh key={i} position={[x, 0.6, z]} castShadow>
                        <boxGeometry args={[0.4, 1.2, 0.4]} />
                        <primitive object={marbleMaterial} />
                    </mesh>
                )
            })}

            {/* Interactive Assets */}
            {ASSETS.map((asset) => (
                <InteractiveWatch
                    key={asset.id}
                    asset={asset}
                    isFocused={viewState === 'PRODUCT' && focusedObjectId === asset.id}
                    setView={setView}
                    setFocusedObject={setFocusedObject}
                    setAnchorPosition={useStore((state) => state.setAnchorPosition)}
                />
            ))}

            {/* Label - In Background */}
            <Text
                position={[0, 4, -4]}
                fontSize={0.5}
                color="#D4AF37"
                anchorX="center"
                anchorY="middle"
                maxWidth={4}
                textAlign="center"
            >
                Transcendence of Man
            </Text>
        </group>
    )
}
