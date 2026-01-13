import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Environment, Sparkles } from '@react-three/drei'
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

                {/* Global Lighting - Cinematic Setup */}
                <ambientLight intensity={0.3} color="#ffffff" />
                <spotLight
                    position={[10, 10, 10]}
                    angle={0.15}
                    penumbra={1}
                    intensity={2}
                    castShadow
                    shadow-bias={-0.0001}
                />
                <rectAreaLight
                    width={20}
                    height={20}
                    position={[-10, 10, -10]}
                    color="#D4AF37"
                    intensity={1}
                    onUpdate={(self) => self.lookAt(0, 0, 0)}
                />

                <Environment preset="city" blur={1} />

                {/* Atmosphere - Golden Dust */}
                <Sparkles
                    count={80}
                    scale={12}
                    size={3}
                    speed={0.2}
                    opacity={0.6}
                    color="#D4AF37"
                />

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
