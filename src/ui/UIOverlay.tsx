import { useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import gsap from 'gsap'

export function UIOverlay() {
    const viewState = useStore((state) => state.viewState)
    const setView = useStore((state) => state.setView)

    // Refs for animation targets
    const titleRef = useRef<HTMLDivElement>(null)
    const subtitleRef = useRef<HTMLParagraphElement>(null)
    const specsRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    // Animation Effect
    useEffect(() => {
        const tl = gsap.timeline()

        if (viewState === 'ROOM') {
            // Room View Animations
            // Fade out specs
            tl.to(specsRef.current, {
                opacity: 0,
                x: 50,
                duration: 0.8,
                ease: 'power3.in',
                pointerEvents: 'none'
            })
                // Fade out back button
                .to(buttonRef.current, {
                    opacity: 0,
                    y: 20,
                    duration: 0.5,
                    pointerEvents: 'none'
                }, "<")
                // Fade in Title
                .to([titleRef.current, subtitleRef.current], {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    stagger: 0.2,
                    ease: 'power3.out',
                    pointerEvents: 'auto'
                }, "-=0.4")

        } else if (viewState === 'PRODUCT') {
            // Product View Animations
            // Fade out Title
            tl.to([titleRef.current, subtitleRef.current], {
                opacity: 0,
                y: -50,
                duration: 0.8,
                ease: 'power3.in',
                pointerEvents: 'none'
            })
                // Fade in Specs
                .fromTo(specsRef.current,
                    { opacity: 0, x: 50 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 1,
                        ease: 'power3.out',
                        pointerEvents: 'auto'
                    }
                )
                // Fade in Back Button
                .fromTo(buttonRef.current,
                    { opacity: 0, y: 20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: 'power2.out',
                        pointerEvents: 'auto'
                    },
                    "-=0.6"
                )
        }

        return () => {
            tl.kill()
        }
    }, [viewState])

    // Escape key listener
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && viewState === 'PRODUCT') {
                setView('ROOM')
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [viewState, setView])

    const anchorPositions = useStore((state) => state.anchorPositions)

    // Refs for text line start points
    const materialTextRef = useRef<HTMLDivElement>(null)
    const dialTextRef = useRef<HTMLDivElement>(null)
    const calibreTextRef = useRef<HTMLDivElement>(null)

    // Utility to get center of an element
    const getPos = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) return { x: 0, y: 0 }
        const rect = ref.current.getBoundingClientRect()
        return {
            x: rect.left, // Start from left edge for right-aligned text? 
            // The layout is "right-0 ... w-96 text-right". 
            // So the text ends near the right edge, but the lines should probably start from the LEFT of the text block 
            // or the bullets?
            // The current design shows lines going from the text to the watch.
            // Let's start from the left edge of the text container.
            y: rect.top + rect.height / 2
        }
    }

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-hidden font-serif">

            {/* --- TOP LEFT BRANDING --- */}
            <div className="absolute top-0 left-0 p-12">
                <h1 ref={titleRef} className="text-5xl text-luxury-gold tracking-[0.2em] uppercase drop-shadow-lg transform translate-y-0 opacity-100">
                    Transcendence of Man
                </h1>
                <p ref={subtitleRef} className="text-sm text-luxury-silver mt-3 tracking-[0.4em] uppercase drop-shadow-md transform translate-y-0 opacity-100 pl-1">
                    House of Wonders
                </p>
            </div>

            {/* --- RIGHT SIDE SPECS (PRODUCT VIEW) --- */}
            <div ref={specsRef} className="absolute top-1/2 right-0 transform -translate-y-1/2 p-12 w-96 text-right opacity-0 translate-x-[50px] pointer-events-none z-20">
                <div className="border-r-2 border-luxury-gold pr-6">
                    <h2 className="text-3xl text-white tracking-widest mb-2 uppercase">Transcendence of Man</h2>
                    <h3 className="text-luxury-gold text-lg tracking-wide mb-6">Selfwinding</h3>

                    <div className="space-y-6 text-luxury-silver text-sm tracking-wider font-sans font-light">
                        <div ref={materialTextRef} className="group relative">
                            <p className="uppercase text-xs text-gray-500 mb-1">Material</p>
                            <p className="text-white group-hover:text-luxury-gold transition-colors">18-carat Yellow Gold</p>
                        </div>
                        <div ref={dialTextRef} className="group relative">
                            <p className="uppercase text-xs text-gray-500 mb-1">Dial</p>
                            <p className="text-white group-hover:text-luxury-gold transition-colors">Grande Tapisserie</p>
                        </div>
                        <div ref={calibreTextRef} className="group relative">
                            <p className="uppercase text-xs text-gray-500 mb-1">Calibre</p>
                            <p className="text-white group-hover:text-luxury-gold transition-colors">4302</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- EVIDENCE LINES SVG --- */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-visible">
                <g className={`transition-opacity duration-500 ${viewState === 'PRODUCT' ? 'opacity-100' : 'opacity-0'}`}>
                    {viewState === 'PRODUCT' && (
                        <>
                            {/* Material Line */}
                            {anchorPositions.material && materialTextRef.current && (
                                <>
                                    <line
                                        x1={getPos(materialTextRef).x}
                                        y1={getPos(materialTextRef).y}
                                        x2={anchorPositions.material.x}
                                        y2={anchorPositions.material.y}
                                        stroke="white"
                                        strokeWidth="1"
                                        strokeOpacity="0.5"
                                    />
                                    <circle cx={anchorPositions.material.x} cy={anchorPositions.material.y} r="3" fill="white" />
                                </>
                            )}
                            {/* Dial Line */}
                            {anchorPositions.dial && dialTextRef.current && (
                                <>
                                    <line
                                        x1={getPos(dialTextRef).x}
                                        y1={getPos(dialTextRef).y}
                                        x2={anchorPositions.dial.x}
                                        y2={anchorPositions.dial.y}
                                        stroke="white"
                                        strokeWidth="1"
                                        strokeOpacity="0.5"
                                    />
                                    {/* No circle for dial usually, covers face */}
                                </>
                            )}
                            {/* Calibre Line */}
                            {anchorPositions.calibre && calibreTextRef.current && (
                                <>
                                    <line
                                        x1={getPos(calibreTextRef).x}
                                        y1={getPos(calibreTextRef).y}
                                        x2={anchorPositions.calibre.x}
                                        y2={anchorPositions.calibre.y}
                                        stroke="white"
                                        strokeWidth="1"
                                        strokeOpacity="0.5"
                                    />
                                    <circle cx={anchorPositions.calibre.x} cy={anchorPositions.calibre.y} r="3" fill="white" />
                                </>
                            )}
                        </>
                    )}
                </g>
            </svg>

            {/* --- TOP RIGHT CLOSE CONTROLS --- */}
            <div className="absolute top-12 right-24 z-30">
                <button
                    ref={buttonRef}
                    onClick={() => setView('ROOM')}
                    className="
                    className="absolute top-12 right-12 z-50 text-white hover:text-gray-300 transition-colors focus:outline-none"
                    onClick={() => {
                        setView('ROOM')
                        setFocusedObject(null)
                    }}
                >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    )
}
