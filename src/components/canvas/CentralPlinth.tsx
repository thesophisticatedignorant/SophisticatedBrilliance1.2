import { useMemo } from 'react'
import * as THREE from 'three'
import { AncientColumnMaterial } from '../../materials/AncientColumnMaterial'

export function CentralPlinth(props: any) {
    // Create a custom profile for the plinth to have soft, eroded edges
    // Lathe spins around Y axis. Points are (radius, height).
    const plinthGeometry = useMemo(() => {
        const points = []
        // Start at center bottom
        // points.push(new THREE.Vector2(0, 0))

        // Bottom flat
        points.push(new THREE.Vector2(0.001, 0))
        points.push(new THREE.Vector2(3.6, 0))

        // Bottom rounded corner (Bevel)
        // Manual bezier-like curve for "eroded" feel
        points.push(new THREE.Vector2(3.8, 0.05))
        points.push(new THREE.Vector2(3.9, 0.15))

        // Vertical Side (slightly irregular/sloped for age)
        points.push(new THREE.Vector2(3.92, 0.4))

        // Top rounded corner (Bevel) - "Edge bevels softened by erosion"
        points.push(new THREE.Vector2(3.9, 0.55))
        points.push(new THREE.Vector2(3.7, 0.6))

        // Top flat surface - "Subtle carved ring detail around perimeter"
        // We can indent the geometry slightly for the ring
        points.push(new THREE.Vector2(3.4, 0.6)) // Outer rim of ring
        points.push(new THREE.Vector2(3.35, 0.59)) // Ring dip
        points.push(new THREE.Vector2(3.2, 0.59)) // Ring dip
        points.push(new THREE.Vector2(3.15, 0.6)) // Inner rim of ring

        // Center flat
        points.push(new THREE.Vector2(0.001, 0.6))

        // LatheGeometry: points, segments
        const geo = new THREE.LatheGeometry(points, 128)
        geo.computeVertexNormals()
        return geo
    }, [])

    return (
        <group {...props}>
            {/* Main Plinth Stone */}
            <mesh receiveShadow castShadow geometry={plinthGeometry}>
                <AncientColumnMaterial
                    uColor={new THREE.Color("#e0d0b0")} // Matching existing light stone
                    uErosionStrength={0.15} // "More preserved, as if restored" - low erosion
                    uEntasisStrength={0.0}
                    uFluteFrequency={0.0}
                    uSandColor={new THREE.Color("#e6a65c")}
                />
            </mesh>
        </group>
    )
}
