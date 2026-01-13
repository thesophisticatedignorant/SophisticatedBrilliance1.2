import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { easing } from 'maath'
import { ASSETS } from '../config/assets'

export function CameraRig() {
    const viewState = useStore((state) => state.viewState)
    const focusedObjectId = useStore((state) => state.focusedObjectId)

    const controlsRef = useRef<any>(null)

    // Room View: High up, looking down at the room center
    const roomPosition = new THREE.Vector3(0, 5, 12)
    const roomTarget = new THREE.Vector3(0, 2, 0)

    // Product View Logic
    // Find the position of the focused object
    const focusedAsset = ASSETS.find(a => a.id === focusedObjectId) || ASSETS[0]

    // Target is the levitation height at the asset's X/Z location
    const targetX = focusedAsset.position[0]
    const targetZ = focusedAsset.position[2]

    // We want the camera to look AT the levitating watch
    const productTarget = new THREE.Vector3(targetX, 3.5, targetZ)

    // Position camera dynamically based on the target position relative to center
    // Direction vector from center to target
    const directionFromCenter = new THREE.Vector3(targetX, 0, targetZ).normalize()

    // If it's the center watch (0,0,0), direction is zero, so default to looking from Z
    if (focusedAsset.id === 'center-watch') {
        directionFromCenter.set(0, 0, 1)
    }

    // Position camera 2.5 units "outward" from the target? 
    // Usually for perimeter items you want to look at them from the center of the room.
    // So direction should be Center -> Target (which is my directionFromCenter).
    // Camera should be at Target - Direction * Distance ? 
    // That puts the camera between the center and the target. Correct. (Back to the room center)
    // UPDATE: User says assets "flip". We are looking at the back.
    // Watches face OUTWARD. We are inside looking out (at the back).
    // We need to look from OUTSIDE IN.
    // Position = Target + Direction * Distance.
    const productPosition = new THREE.Vector3()
        .copy(productTarget)
        .add(directionFromCenter.clone().multiplyScalar(2.5))

    const isAnimating = useRef(true)
    const lastViewState = useRef(viewState)
    const lastFocusedId = useRef(focusedObjectId)

    if (lastViewState.current !== viewState || lastFocusedId.current !== focusedObjectId) {
        isAnimating.current = true
        lastViewState.current = viewState
        lastFocusedId.current = focusedObjectId
    }

    useFrame((state, delta) => {
        if (!controlsRef.current) return

        if (isAnimating.current) {
            const targetPos = viewState === 'PRODUCT' ? productPosition : roomPosition
            const targetLookAt = viewState === 'PRODUCT' ? productTarget : roomTarget

            easing.damp3(state.camera.position, targetPos, 0.5, delta)
            easing.damp3(controlsRef.current.target, targetLookAt, 0.5, delta)

            if (state.camera.position.distanceTo(targetPos) < 0.1 &&
                controlsRef.current.target.distanceTo(targetLookAt) < 0.1) {
                isAnimating.current = false
            }

            controlsRef.current.update()
        }
    })

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 3, 9]} fov={45} />
            <OrbitControls
                ref={controlsRef}
                enablePan={false}
                // Allow full rotation in PRODUCT view, restrict in ROOM view
                // UPDATE: User wants OBJECT rotation, not camera rotation in product view.
                enableRotate={viewState !== 'PRODUCT'}
                maxPolarAngle={Math.PI / 2}
                minDistance={1}
                maxDistance={15}
                enableDamping={true}
                dampingFactor={0.05}
            />
        </>
    )
}
