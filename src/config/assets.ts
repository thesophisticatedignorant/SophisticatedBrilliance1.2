import * as THREE from 'three'

export interface AssetConfig {
    id: string
    position: [number, number, number]
    rotation: [number, number, number]
    label: string
}

const CENTER_ASSET: AssetConfig = {
    id: 'center-watch',
    position: [0, 2.0, 0],
    rotation: [Math.PI / 3, 0, 0],
    label: 'TRANSCENDENCE'
}

const PERIMETER_RADIUS = 3.5
const PERIMETER_COUNT = 5
const PERIMETER_ASSETS: AssetConfig[] = Array.from({ length: PERIMETER_COUNT }).map((_, i) => {
    // 5 items distributed in a circle
    // We want to avoid placing one directly in front if possible, or rotate appropriately.
    // Let's start from an offset to match the pillar rotation (PI/6 offset?).
    // Pillars are at: (i / 5) * 2PI + PI/6?
    // Let's match the pillar logic we plan to use: 5 pillars.
    const angle = (i / PERIMETER_COUNT) * Math.PI * 2
    const x = Math.sin(angle) * PERIMETER_RADIUS
    const z = Math.cos(angle) * PERIMETER_RADIUS

    return {
        id: `perimeter-watch-${i}`,
        position: [x, 1.5, z],
        // Rotate to face outward or inward? Usually assets face the guest.
        // If facing 0,0,0: rotation.y = angle + PI
        rotation: [Math.PI / 3, angle, 0],
        label: `COLLECTION ${i + 1}`
    }
})

export const ASSETS = [CENTER_ASSET, ...PERIMETER_ASSETS]
