import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Cloud } from '@react-three/drei'
import * as THREE from 'three'
import { WatchModel } from '../components/WatchModel'
import { useStore } from '../store/useStore'
import { easing } from 'maath'
import { ASSETS } from '../config/assets'



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

function Spotlight({ targetPosition, visible }: { targetPosition: [number, number, number], visible: boolean }) {
    const light = useRef<THREE.SpotLight>(null)
    const targetRef = useRef(new THREE.Object3D())
    const target = targetRef.current

    useFrame((_, delta) => {
        if (!light.current) return
        const targetIntensity = visible ? 5 : 0
        using: easing.damp(light.current, 'intensity', targetIntensity, 0.2, delta)
        target.position.set(...targetPosition)
    })

    return (
        <group>
            <primitive object={target} />
            <spotLight
                ref={light}
                position={[targetPosition[0], 10, targetPosition[2]]}
                angle={0.15}
                penumbra={1}
                distance={15}
                castShadow
                intensity={0}
                color="#fff"
                target={target}
            />
            {/* God Ray / Volumetric cone simulation */}
            {visible && (
                <mesh position={[targetPosition[0], 5, targetPosition[2]]} rotation={[0, 0, 0]}>
                    <cylinderGeometry args={[0.01, 1.5, 10, 32]} />
                    <meshBasicMaterial transparent opacity={0.05} color="#fff" side={THREE.DoubleSide} />
                </mesh>
            )}
        </group>
    )
}

import { AncientColumnMaterial } from '../materials/AncientColumnMaterial'
import { DesertSandMaterial } from '../materials/DesertSandMaterial'


// Palette moved inline or to config if needed in future

export function APFamilyRoom() {
    const setView = useStore((state) => state.setView)
    const viewState = useStore((state) => state.viewState)
    const focusedObjectId = useStore((state) => state.focusedObjectId)
    const setFocusedObject = useStore((state) => state.setFocusedObject)
    const setAnchorPosition = useStore((state) => state.setAnchorPosition)

    const focusedAsset = ASSETS.find(a => a.id === focusedObjectId)
    const spotlightPos: [number, number, number] = focusedAsset ? [focusedAsset.position[0], 3.5, focusedAsset.position[2]] : [0, 0, 0]

    const { scene } = useThree()

    useEffect(() => {
        const oldBg = scene.background
        const oldFog = scene.fog

        scene.background = new THREE.Color('#e6c288')
        scene.fog = new THREE.Fog('#e6c288', 20, 150)

        return () => {
            scene.background = oldBg
            scene.fog = oldFog
        }
    }, [scene])

    return (
        <group>
            {/* Dramatic Sahara Day Environment */}
            {/* Background handled in useEffect to ensure scene attachment */}

            {/* Bright Ambient fill */}
            <ambientLight intensity={0.6} color="#ffeebb" />

            {/* Visible Sun Mesh */}
            <mesh position={[-50, 40, -80]}>
                <sphereGeometry args={[8, 32, 32]} />
                <meshBasicMaterial color="#fffacd" />
            </mesh>

            {/* Clouds - lighter and fluffier */}
            <group position={[0, 30, -50]}>
                <Cloud opacity={0.6} speed={0.2} segments={20} bounds={[60, 10, 60]} position={[-20, 0, 0]} color="#fff" />
                <Cloud opacity={0.5} speed={0.2} segments={20} bounds={[50, 8, 50]} position={[20, 5, -10]} color="#fff" />
            </group>

            {/* Sharp Sunlight for Dunes */}
            <directionalLight
                position={[-50, 50, -80]} // Higher sun for sharper shadows
                intensity={4.0}
                castShadow
                color="#fff5cc"
                shadow-bias={-0.0001}
                shadow-mapSize={[2048, 2048]}
            >
                <orthographicCamera attach="shadow-camera" args={[-80, 80, 80, -80]} near={1} far={300} />
            </directionalLight>

            <Spotlight targetPosition={spotlightPos} visible={viewState === 'PRODUCT'} />

            {/* Procedural Dunes - Increase segments for sharpness */}
            {/* 512x512 segments for high fidelity ridge displacement */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
                <planeGeometry args={[1000, 1000, 512, 512]} />
                <DesertSandMaterial
                    sunPosition={[-50, 50, -80]}
                    COLORS={{
                        shadow: '#b88a57',
                        mid: '#E0C090',
                        highlight: '#FFD700'
                    }}
                    displacementStrength={25.0}
                    noiseScale={1.5}
                    macroHeight={40.0}
                    macroScale={0.04}
                />
            </mesh>

            {/* Background Sandstone Mountains */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, -200]} receiveShadow>
                <planeGeometry args={[500, 150, 256, 256]} />
                <DesertSandMaterial
                    sunPosition={[-50, 50, -80]}
                    COLORS={{
                        shadow: '#b88a57',
                        mid: '#E0C090',
                        highlight: '#FFD700'
                    }}
                    displacementStrength={30.0}
                    noiseScale={2.5}
                    macroHeight={60.0}
                    macroScale={0.05}
                />
            </mesh>

            {/* Floating Columns & Assets */}
            {ASSETS.map((asset, i) => {
                const isCenter = asset.id === 'center-watch'

                return (
                    <group key={asset.id}>
                        {/* The Column Platform */}
                        <group position={[asset.position[0], asset.position[1] - 2.5, asset.position[2]]}
                            rotation={[
                                isCenter ? 0.2 : (Math.PI / 4) + Math.sin(i * 123.4) * 0.5,
                                isCenter ? 0.1 : (Math.PI / 3) + Math.cos(i * 567.8) * 0.5,
                                isCenter ? 0.1 : (Math.PI / 6) + Math.sin(i * 910.1) * 0.3
                            ]}
                        >
                            <mesh receiveShadow castShadow rotation={[0, Math.PI / 4, 0]}>
                                <cylinderGeometry args={[1.8, 1.8, 1.2, 8]} /> {/* Flatted "drum" shape */}
                                <AncientColumnMaterial uColor={new THREE.Color("#ffffff")} />
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
            })}

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
        </group>
    )
}
