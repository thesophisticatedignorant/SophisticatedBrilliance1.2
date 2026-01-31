import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { WatchModel } from '../components/WatchModel'
import { useStore } from '../store/useStore'
import { easing } from 'maath'
import { ASSETS } from '../config/assets'
import { DesertLandscape } from '../environment/DesertLandscape'
import { AncientColumnMaterial } from '../materials/AncientColumnMaterial'



function InteractiveWatch({ asset, isFocused, setView, setFocusedObject, setAnchorPosition }: any) {
    const ref = useRef<THREE.Group>(null)
    const modelRef = useRef<any>(null)
    const isDragging = useRef(false)
    const lastPos = useRef({ x: 0, y: 0 })
    const { camera, size } = useThree()
    const tempV = useRef(new THREE.Vector3())

    const targetRotation = useRef({ x: 0, y: 0 })
    const currentRotation = useRef({ x: 0, y: 0 })
    const baseAngleRef = useRef(0)
    const wasFocused = useRef(isFocused)

    useFrame((state, delta) => {
        if (!ref.current) return

        // Subtle floating animation
        const floatY = isFocused ? 0 : Math.sin(state.clock.elapsedTime * 1.5) * 0.05
        const targetY = (isFocused ? 3.5 : asset.position[1]) + floatY
        easing.damp3(ref.current.position, [asset.position[0], targetY, asset.position[2]], 0.4, delta)

        ref.current.rotation.order = 'YXZ'

        if (isFocused) {
            if (!wasFocused.current) {
                targetRotation.current = { x: 0, y: 0 }
                currentRotation.current = { x: 0, y: 0 }

                // Calculate ideal base angle (the angle the camera will move to)
                const isCenter = asset.id === 'center-watch'
                const idealAngle = isCenter ? 0 : Math.atan2(asset.position[0], asset.position[2])
                baseAngleRef.current = idealAngle

                wasFocused.current = true
            }

            // In focus, we stay locked to the ideal angle (unless we want to track subtle camera movement)
            // But user requested "no spin", so a stable baseAngle is better.
            // We can still allow manual drag via targetRotation.current.y

            easing.damp(currentRotation.current, 'x', targetRotation.current.x, 0.1, delta)
            easing.damp(currentRotation.current, 'y', targetRotation.current.y, 0.1, delta)

            ref.current.rotation.y = baseAngleRef.current + currentRotation.current.y
            ref.current.rotation.x = Math.PI / 2 + currentRotation.current.x

            if (modelRef.current) {
                const anchors = modelRef.current.getAnchors()
                if (anchors) {
                    const projectAnchor = (obj: THREE.Object3D, key: string) => {
                        if (!obj) return
                        const v = tempV.current
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
            if (wasFocused.current) wasFocused.current = false
            // Smoothly return to original room rotation
            easing.dampE(ref.current.rotation, asset.rotation, 0.25, delta)
        }
    })

    const handlePointerDown = (e: any) => {
        if (!isFocused) return
        e.stopPropagation()
        isDragging.current = true
        lastPos.current = { x: e.screenX, y: e.screenY }
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
            targetRotation.current.y += dx * 0.015
            targetRotation.current.x += dy * 0.015
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
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
        </group>
    )
}






// Palette moved inline or to config if needed in future

export function APFamilyRoom() {
    const setView = useStore((state) => state.setView)
    const viewState = useStore((state) => state.viewState)
    const focusedObjectId = useStore((state) => state.focusedObjectId)
    const setFocusedObject = useStore((state) => state.setFocusedObject)
    const setAnchorPosition = useStore((state) => state.setAnchorPosition)



    return (
        <group>
            <DesertLandscape />

            {/* Floating Columns & Assets */}
            {/* ANCIENT ROMAN PLATFORM */}
            <group position={[0, -0.2, 0]}>
                {/* Main Base */}
                <mesh receiveShadow castShadow position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[8, 9, 0.6, 64]} />
                    <AncientColumnMaterial uColor={new THREE.Color("#dccca3")} uDecayThreshold={0.6} uDecayScale={10.0} />
                </mesh>
                {/* Upper Tier */}
                <mesh receiveShadow castShadow position={[0, 0.6, 0]}>
                    <cylinderGeometry args={[6, 6.5, 0.4, 64]} />
                    <AncientColumnMaterial uColor={new THREE.Color("#e0d0b0")} uDecayThreshold={0.7} />
                </mesh>
            </group>

            {/* Floating Columns & Assets */}
            {ASSETS.map((asset) => {
                const isCenter = asset.id === 'center-watch';
                const colHeight = isCenter ? 3.0 : 3.8;
                const colRadius = isCenter ? 0.8 : 0.5;
                const colY = isCenter ? 2.0 : 1.5; // Roughly buried

                return (
                    <group key={asset.id}>
                        {/* The Ruined Column */}
                        <group position={[asset.position[0], colY, asset.position[2]]}>
                            <mesh receiveShadow castShadow position={[0, 0, 0]}>
                                <cylinderGeometry args={[colRadius * 0.9, colRadius, colHeight, 32]} />
                                <AncientColumnMaterial
                                    uColor={new THREE.Color("#e6dcb4")}
                                    uDecayThreshold={0.75}
                                    uDecayScale={3.0}
                                    uFluteFrequency={isCenter ? 30.0 : 20.0}
                                />
                            </mesh>
                            {/* Weathered Capital */}
                            <mesh position={[0, colHeight / 2, 0]} receiveShadow castShadow>
                                <cylinderGeometry args={[colRadius * 1.2, colRadius * 0.9, 0.3, 32]} />
                                <AncientColumnMaterial uColor={new THREE.Color("#d4c8a8")} uDecayThreshold={0.5} />
                            </mesh>
                        </group>

                        <InteractiveWatch
                            asset={asset}
                            isFocused={viewState === 'PRODUCT' && focusedObjectId === asset.id}
                            setView={setView}
                            setFocusedObject={setFocusedObject}
                            setAnchorPosition={setAnchorPosition}
                        />
                    </group>
                )
            })
            }

            {/* Typography */}
            <group position={[-15, 12, -20]} rotation={[0, 0.2, 0]}>
                <Text
                    position={[0, 2, 0]}
                    fontSize={2.5}
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                    color="#ffffff"
                    anchorX="left"
                    anchorY="bottom"
                    maxWidth={20}
                    lineHeight={1}
                    letterSpacing={0.1}
                >
                    TRANSCENDENCE OF MAN
                </Text>
                <Text
                    position={[0, 0, 0]}
                    fontSize={0.8}
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                    color="#eee"
                    anchorX="left"
                    anchorY="top"
                    maxWidth={20}
                    letterSpacing={0.2}
                >
                    HOUSE OF WONDERS
                </Text>
            </group>
        </group >
    )
}
