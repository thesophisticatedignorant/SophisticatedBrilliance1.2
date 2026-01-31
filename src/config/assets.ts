

export interface AssetConfig {
    id: string
    position: [number, number, number]
    rotation: [number, number, number]
    label: string
}

const CENTER_ASSET: AssetConfig = {
    id: 'center-watch',
    position: [0, 4.5, 0], // Raised for 4m columns
    rotation: [Math.PI / 3, -Math.PI / 2, 0],
    label: 'TRANSCENDENCE'
}

const PERIMETER_RADIUS = 5.5 // Widened for grander scale
const PERIMETER_COUNT = 5
const PERIMETER_ASSETS: AssetConfig[] = Array.from({ length: PERIMETER_COUNT }).map((_, i) => {
    const angle = (i / PERIMETER_COUNT) * Math.PI * 2
    const x = Math.sin(angle) * PERIMETER_RADIUS
    const z = Math.cos(angle) * PERIMETER_RADIUS

    return {
        id: `perimeter-watch-${i}`,
        position: [x, 4.2, z], // Raised for 4m columns
        rotation: [Math.PI / 3, angle - Math.PI / 2, 0],
        label: `COLLECTION ${i + 1}`
    }
})

export const ASSETS = [CENTER_ASSET, ...PERIMETER_ASSETS]
