import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'

import { CameraRig } from './CameraRig'

interface SceneControllerProps {
    children?: React.ReactNode
}

export function SceneController({ children }: SceneControllerProps) {
    return (
        <div className="w-full h-screen relative bg-luxury-black">
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 z-10 w-full h-full pointer-events-none">
                {/* Diegetic UI components will go here */}
            </div>

            <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }}>
                <CameraRig />

                {/* Global Lighting removed to allow Room-specific control */}

                <Suspense fallback={null}>
                    {children}
                </Suspense>

                <EffectComposer>
                    <Bloom
                        luminanceThreshold={1.2}
                        mipmapBlur
                        intensity={0.4}
                        radius={0.6}
                    />
                    <Noise opacity={0.015} />
                    <Vignette eskil={false} offset={0.1} darkness={0.8} />
                </EffectComposer>
            </Canvas>
        </div>
    )
}
