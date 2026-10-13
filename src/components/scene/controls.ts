import type { KeyboardControlsEntry } from '@react-three/drei'

export const Controls = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
} as const

export type Control = (typeof Controls)[keyof typeof Controls]

export const keyboardMap: KeyboardControlsEntry<Control>[] = [
  { name: Controls.forward, keys: ['KeyW', 'ArrowUp'] },
  { name: Controls.backward, keys: ['KeyS', 'ArrowDown'] },
  { name: Controls.left, keys: ['KeyA', 'ArrowLeft'] },
  { name: Controls.right, keys: ['KeyD', 'ArrowRight'] },
]
