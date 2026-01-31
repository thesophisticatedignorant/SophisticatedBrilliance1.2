import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { Hud, OrthographicCamera, Text } from '@react-three/drei'
import * as THREE from 'three'
import { getDuneHeight } from '../utils/terrain'

export function HeightMapLayer() {
    const { size } = useThree()

    // Generate the height map texture once
    const texture = useMemo(() => {
        const width = 256
        const height = 256
        const bufferSize = width * height
        const data = new Uint8Array(4 * bufferSize)

        // World size is 800x800 based on DesertLandscape
        const worldSize = 800

        for (let i = 0; i < bufferSize; i++) {
            const stride = i * 4

            const xIndex = i % width
            const yIndex = Math.floor(i / width)

            // Normalize uv to -0.5..0.5
            // Invert Y to match map orientation if needed, but World Z increases 'down' typically in top down view

            const u = (xIndex / (width - 1)) - 0.5
            const v = (yIndex / (height - 1)) - 0.5

            // World coords
            const wx = u * worldSize
            const wz = v * worldSize

            const h = getDuneHeight(wx, wz)

            // Normalize height for visualization
            // Range approx -15 to 45 (60 units)
            const normalized = (h + 15) / 60
            const val = Math.floor(Math.max(0, Math.min(1, normalized)) * 255)

            // Gradient Map (Heatmap style) or Grayscale
            // Let's do Grayscale for "Explicit Elevation"
            data[stride] = val     // R
            data[stride + 1] = val // G
            data[stride + 2] = val // B
            data[stride + 3] = 255   // A
        }

        const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat)
        tex.flipY = true // Match standard UV space
        tex.needsUpdate = true
        return tex
    }, [])

    // Position in Top-Right corner
    // Orthographic camera maps units to pixels if we set zoom=1 and don't adjust
    // But default Ortho is usually -1..1 or similar unless args provided.
    // Let's explicitly set up camera to match screen pixels size/2

    const margin = 20
    const mapSize = 200

    return (
        <Hud renderPriority={1}>
            <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={1} left={-size.width / 2} right={size.width / 2} top={size.height / 2} bottom={-size.height / 2} />
            <group position={[size.width / 2 - mapSize / 2 - margin, size.height / 2 - mapSize / 2 - margin, 0]}>

                {/* Background Border */}
                <mesh position={[0, 0, -0.1]}>
                    <planeGeometry args={[mapSize + 4, mapSize + 4]} />
                    <meshBasicMaterial color="black" />
                </mesh>

                {/* The Map */}
                <mesh>
                    <planeGeometry args={[mapSize, mapSize]} />
                    <meshBasicMaterial map={texture} />
                </mesh>

                {/* Label */}
                <Text
                    position={[0, -mapSize / 2 - 15, 0]}
                    fontSize={14}
                    color="white"
                    anchorX="center"
                    anchorY="top"
                >
                    ELEVATION SCAN
                </Text>
            </group>
        </Hud>
    )
}
