import { useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import gsap from 'gsap'

export function UIOverlay() {
    const viewState = useStore((state) => state.viewState)
    const setView = useStore((state) => state.setView)
    const setFocusedObject = useStore((state) => state.setFocusedObject)
    const macroMode = useStore((state) => state.macroMode)
    const setMacroMode = useStore((state) => state.setMacroMode)

    // Refs for animation targets
    const titleRef = useRef<HTMLDivElement>(null)
    const subtitleRef = useRef<HTMLParagraphElement>(null)
    const specsRef = useRef<HTMLDivElement>(null)
    const narrativeRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const macroButtonRef = useRef<HTMLButtonElement>(null)

    // Animation Effect
    useEffect(() => {
        const tl = gsap.timeline()

        if (viewState === 'ROOM') {
            tl.to([specsRef.current, narrativeRef.current, macroButtonRef.current], {
                opacity: 0,
                x: (i) => i === 0 ? 50 : -50,
                duration: 0.6,
                ease: 'power3.in',
                pointerEvents: 'none'
            })
                .to(buttonRef.current, {
                    opacity: 0,
                    y: 20,
                    duration: 0.4,
                    pointerEvents: 'none'
                }, "<")
            // Title/Subtitle animations removed to keep them static

        } else if (viewState === 'PRODUCT') {
            // Title/Subtitle animations removed to keep them static
            tl.fromTo([specsRef.current, narrativeRef.current, macroButtonRef.current],
                { opacity: 0, x: (i) => i === 0 ? 50 : -50 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.8,
                    stagger: 0.2,
                    ease: 'power3.out',
                    pointerEvents: 'auto'
                }
            )
                .fromTo(buttonRef.current,
                    { opacity: 0, y: 20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                        pointerEvents: 'auto'
                    },
                    "-=0.4"
                )
        }

        return () => {
            tl.kill()
        }
    }, [viewState])

    // Escape key listener
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (macroMode) {
                    setMacroMode(false)
                } else if (viewState === 'PRODUCT') {
                    setView('ROOM')
                    setFocusedObject(null)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [viewState, macroMode, setView, setFocusedObject, setMacroMode])

    const anchorPositions = useStore((state) => state.anchorPositions)

    // Refs for text line start points
    const materialTextRef = useRef<HTMLDivElement>(null)
    const dialTextRef = useRef<HTMLDivElement>(null)
    const calibreTextRef = useRef<HTMLDivElement>(null)

    const getPos = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) return { x: 0, y: 0 }
        const rect = ref.current.getBoundingClientRect()
        return {
            x: rect.left,
            y: rect.top + rect.height / 2
        }
    }

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-hidden font-serif">

            {/* --- TOP LEFT BRANDING --- */}
            <div className="absolute top-0 left-0 p-12 opacity-60"> {/* Reduced container severity/opacity */}
                <h1 ref={titleRef} className="text-4xl text-luxury-gold tracking-[0.2em] uppercase drop-shadow-lg opacity-80">
                    Transcendence of Man
                </h1>
                <p ref={subtitleRef} className="text-xs text-luxury-silver mt-2 tracking-[0.4em] uppercase drop-shadow-md opacity-60 pl-1">
                    House of Wonders
                </p>
            </div>

            {/* --- LEFT SIDE NARRATIVE (PRODUCT VIEW) --- */}
            <div ref={narrativeRef} className="absolute top-1/2 left-0 transform -translate-y-1/2 p-12 w-[30rem] text-left opacity-0 -translate-x-[50px] pointer-events-none z-20">
                <div className="border-l-2 border-luxury-gold pl-8">
                    <p className="text-luxury-gold text-xs tracking-[0.3em] uppercase mb-4 font-sans font-bold">The Narrative</p>
                    <h2 className="text-3xl text-white tracking-widest mb-6 uppercase leading-tight">A Dialogue Between <br /> Heavens and Earth</h2>
                    <p className="text-luxury-silver text-sm leading-relaxed tracking-wide font-sans font-light">
                        Crafted at the intersection of classical proportion and modern horology. Each component is a testament to the pursuit of perfection, mirroring the divine geometry found in the temples of antiquity.
                    </p>

                    <button
                        ref={macroButtonRef}
                        onClick={() => setMacroMode(!macroMode)}
                        className="mt-12 group pointer-events-auto flex items-center gap-4 text-white hover:text-luxury-gold transition-colors duration-300"
                    >
                        <div className={`w-12 h-px bg-luxury-gold transition-all duration-500 ${macroMode ? 'w-24' : 'w-12'}`} />
                        <span className="text-[10px] tracking-[0.4em] uppercase font-sans">
                            {macroMode ? 'Exit Macro View' : 'Enter Macro View'}
                        </span>
                    </button>
                </div>
            </div>

            {/* --- RIGHT SIDE SPECS (PRODUCT VIEW) --- */}
            <div ref={specsRef} className="absolute top-1/2 right-0 transform -translate-y-1/2 p-12 w-96 text-right opacity-0 translate-x-[50px] pointer-events-none z-20">
                <div className="border-r-2 border-luxury-gold pr-6">
                    <h2 className="text-3xl text-white tracking-widest mb-2 uppercase">Transcendence</h2>
                    <h3 className="text-luxury-gold text-lg tracking-wide mb-6 italic">Selfwinding</h3>

                    <div className="space-y-8 text-luxury-silver text-sm tracking-wider font-sans font-light">
                        <div ref={materialTextRef} className="group relative">
                            <p className="uppercase text-[10px] text-gray-500 mb-1 tracking-[0.2em]">Material</p>
                            <p className="text-white group-hover:text-luxury-gold transition-colors text-base">18-carat Yellow Gold</p>
                        </div>
                        <div ref={dialTextRef} className="group relative">
                            <p className="uppercase text-[10px] text-gray-500 mb-1 tracking-[0.2em]">Dial</p>
                            <p className="text-white group-hover:text-luxury-gold transition-colors text-base">Grande Tapisserie</p>
                        </div>
                        <div ref={calibreTextRef} className="group relative">
                            <p className="uppercase text-[10px] text-gray-500 mb-1 tracking-[0.2em]">Calibre</p>
                            <p className="text-white group-hover:text-luxury-gold transition-colors text-base">4302</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- EVIDENCE LINES SVG --- */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-visible">
                <g className={`transition-opacity duration-1000 ${viewState === 'PRODUCT' && !macroMode ? 'opacity-100' : 'opacity-0'}`}>
                    {viewState === 'PRODUCT' && (
                        <>
                            {anchorPositions.material && materialTextRef.current && (
                                <>
                                    <line
                                        x1={getPos(materialTextRef).x}
                                        y1={getPos(materialTextRef).y}
                                        x2={anchorPositions.material.x}
                                        y2={anchorPositions.material.y}
                                        stroke="white"
                                        strokeWidth="0.5"
                                        strokeOpacity="0.3"
                                    />
                                    <circle cx={anchorPositions.material.x} cy={anchorPositions.material.y} r="2" fill="white" fillOpacity="0.5" />
                                </>
                            )}
                            {anchorPositions.dial && dialTextRef.current && (
                                <line
                                    x1={getPos(dialTextRef).x}
                                    y1={getPos(dialTextRef).y}
                                    x2={anchorPositions.dial.x}
                                    y2={anchorPositions.dial.y}
                                    stroke="white"
                                    strokeWidth="0.5"
                                    strokeOpacity="0.3"
                                />
                            )}
                            {anchorPositions.calibre && calibreTextRef.current && (
                                <>
                                    <line
                                        x1={getPos(calibreTextRef).x}
                                        y1={getPos(calibreTextRef).y}
                                        x2={anchorPositions.calibre.x}
                                        y2={anchorPositions.calibre.y}
                                        stroke="white"
                                        strokeWidth="0.5"
                                        strokeOpacity="0.3"
                                    />
                                    <circle cx={anchorPositions.calibre.x} cy={anchorPositions.calibre.y} r="2" fill="white" fillOpacity="0.5" />
                                </>
                            )}
                        </>
                    )}
                </g>
            </svg>

            {/* --- TOP RIGHT CLOSE CONTROLS --- */}
            <div className="absolute top-16 right-32 z-30">
                <button
                    ref={buttonRef}
                    className="group relative focus:outline-none pointer-events-auto flex items-center justify-center w-12 h-12"
                    onClick={() => {
                        setView('ROOM')
                        setFocusedObject(null)
                        setMacroMode(false)
                    }}
                >
                    {/* Gold Illumination Backdrop */}
                    <div className="absolute inset-0 bg-luxury-gold/20 rounded-full blur-xl group-hover:bg-luxury-gold/40 transition-all duration-500 scale-150" />
                    <div className="absolute inset-0 border border-luxury-gold/30 rounded-full group-hover:border-luxury-gold/60 transition-all duration-500 scale-110" />

                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="relative z-10 text-white group-hover:text-luxury-gold group-hover:scale-110 transition-all duration-300 drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    )
}
