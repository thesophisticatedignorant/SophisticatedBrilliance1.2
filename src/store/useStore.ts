import { create } from 'zustand'

export type InteractionMode = 'MACRO' | 'MESO' | 'MICRO'

export interface RoomState {
    currentRoom: string
    targetRoom: string | null
    interactionMode: InteractionMode
    focusedObjectId: string | null
    viewState: 'ROOM' | 'PRODUCT'

    // Actions
    setRoom: (roomId: string) => void
    setInteractionMode: (mode: InteractionMode) => void
    setFocusedObject: (objectId: string | null) => void
    setView: (view: 'ROOM' | 'PRODUCT') => void

    // Evidence Lines
    anchorPositions: { [key: string]: { x: number, y: number } }
    setAnchorPosition: (key: string, pos: { x: number, y: number }) => void
}

export const useStore = create<RoomState>((set) => ({
    currentRoom: 'ap_family',
    targetRoom: null,
    interactionMode: 'MACRO',
    focusedObjectId: null,
    viewState: 'ROOM',
    anchorPositions: {},

    setRoom: (roomId) => set({ currentRoom: roomId }),
    setInteractionMode: (mode) => set({ interactionMode: mode }),
    setFocusedObject: (objectId) => set({ focusedObjectId: objectId }),
    setView: (view) => set({ viewState: view }),
    setAnchorPosition: (key, pos) => set((state) => ({
        anchorPositions: { ...state.anchorPositions, [key]: pos }
    })),
}))
