import * as React from 'react'
import { Object3DNode } from '@react-three/fiber'

declare module '@react-three/fiber' {
    interface ThreeElements {
        tapisserieMaterial: Object3DNode<any, any>
        saharaMountainShaderMaterial: Object3DNode<any, any>
        ancientColumnShaderMaterial: Object3DNode<any, any>
    }
}
