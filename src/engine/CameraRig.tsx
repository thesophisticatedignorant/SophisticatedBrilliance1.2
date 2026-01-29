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
    const macroMode = useStore((state) => state.macroMode)

    const controlsRef = useRef<any>(null)

    // Room View: High up, looking down at the room center
    const roomPosition = new THREE.Vector3(0, 5, 12)
    const roomTarget = new THREE.Vector3(0, 2, 0)

    // Product View Logic
    const focusedAsset = ASSETS.find(a => a.id === focusedObjectId) || ASSETS[0]
    const targetX = focusedAsset.position[0]
    const targetZ = focusedAsset.position[2]

    // Base height for product view
    const productTarget = new THREE.Vector3(targetX, 3.5, targetZ)

    // Macro Mode Adjustments: Move camera closer and shift FOV
    const zoomDistance = macroMode ? 1.2 : 3.0
    const targetFOV = macroMode ? 25 : 45

    const directionFromCenter = new THREE.Vector3(targetX, 0, targetZ).normalize()
    if (focusedAsset.id === 'center-watch') {
        directionFromCenter.set(0, 0, 1)
    }

    const productPosition = new THREE.Vector3()
        .copy(productTarget)
        .add(directionFromCenter.clone().multiplyScalar(zoomDistance))
        .add(new THREE.Vector3(0, macroMode ? 0.2 : 1.0, 0))

    useFrame((state, delta) => {
        if (!controlsRef.current) return

        const targetPos = viewState === 'PRODUCT' ? productPosition : roomPosition
        const targetLookAt = viewState === 'PRODUCT' ? productTarget : roomTarget
        const currentTargetFOV = viewState === 'PRODUCT' ? targetFOV : 45

        // Use damping for all camera properties for a premium feel
        // LOCK DISABLED: Allowing free navigation
        // easing.damp3(state.camera.position, targetPos, 0.4, delta)
        // easing.damp3(controlsRef.current.target, targetLookAt, 0.4, delta)
        // easing.damp(state.camera, 'fov', currentTargetFOV, 0.4, delta)
        state.camera.updateProjectionMatrix()

        controlsRef.current.update()
    })

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 3, 9]} fov={45} />
            <OrbitControls
                ref={controlsRef}
                enablePan={false}
                enableRotate={true}
                minDistance={1}
                maxDistance={15}
                enableDamping={true}
                dampingFactor={0.05}
            />
        </>
    )
}
