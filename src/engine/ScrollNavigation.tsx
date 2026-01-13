import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export function ScrollNavigation() {
    const setView = useStore((state) => state.setView)
    const viewState = useStore((state) => state.viewState)

    useEffect(() => {
        let lastScrollTime = 0

        const handleWheel = (e: WheelEvent) => {
            const now = Date.now()
            // Debounce to prevent rapid firing
            if (now - lastScrollTime < 1000) return

            // Threshold
            if (Math.abs(e.deltaY) < 30) return

            if (e.deltaY > 0 && viewState === 'ROOM') {
                setView('PRODUCT')
                lastScrollTime = now
            } else if (e.deltaY < 0 && viewState === 'PRODUCT') {
                setView('ROOM')
                lastScrollTime = now
            }
        }

        window.addEventListener('wheel', handleWheel)
        return () => window.removeEventListener('wheel', handleWheel)
    }, [viewState, setView])

    return null
}
