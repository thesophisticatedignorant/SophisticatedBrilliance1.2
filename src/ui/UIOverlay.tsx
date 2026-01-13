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
                        <div className="group relative">
                            <p className="uppercase text-xs text-gray-500 mb-1">Material</p>
                            <p className="text-white group-hover:text-luxury-gold transition-colors">18-carat Yellow Gold</p>
                        </div>
                        <div className="group relative">
                            <p className="uppercase text-xs text-gray-500 mb-1">Dial</p>
                            <p className="text-white group-hover:text-luxury-gold transition-colors">Grande Tapisserie</p>
                        </div>
                        <div className="group relative">
                            <p className="uppercase text-xs text-gray-500 mb-1">Calibre</p>
                            <p className="text-white group-hover:text-luxury-gold transition-colors">4302</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- EVIDENCE LINES SVG --- */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-visible">
                {/* Only visible in PRODUCT view. We can use fade transition logic or simple conditional rendering if wrapped in animated div. 
                    Let's revert to simple conditional for the lines opacity controlled by parent or GSAP? 
                    Actually, let's just render them and let GSAP opacity on a container handle it?
                    The specsRef handles the text. The lines are separate.
                    Let's just hardcode them visible for now effectively, but we need GSAP to animate them.
                    For simplicity in this step, let's attach them to the same GSAP/CSS mechanism or just use opacity transition.
                */}
                <g className={`transition-opacity duration-1000 ${viewState === 'PRODUCT' ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Line 1: Material */}
                    <line x1="80%" y1="58%" x2="52%" y2="50%" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
                    <circle cx="52%" cy="50%" r="3" fill="white" />

                    {/* Line 2: Dial */}
                    <line x1="80%" y1="68%" x2="50%" y2="50%" stroke="white" strokeWidth="1" strokeOpacity="0.5" />

                    {/* Line 3: Calibre */}
                    <line x1="80%" y1="78%" x2="48%" y2="55%" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
                    <circle cx="48%" cy="55%" r="3" fill="white" />
                </g>
            </svg>

            {/* --- TOP RIGHT CLOSE CONTROLS --- */}
            {/* Moved inward (right-24) and styled white */}
            <div className="absolute top-12 right-24 z-30">
                <button
                    ref={buttonRef}
                    onClick={() => setView('ROOM')}
                    className="
                        pointer-events-auto opacity-0 translate-y-[20px]
                        w-16 h-16 flex items-center justify-center
                        border border-white rounded-full
                        text-white
                        bg-transparent
                        hover:scale-110 hover:bg-white hover:text-black
                        transition-all duration-500 ease-out
                        group
                    "
                    aria-label="Back to Room"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    )
}
