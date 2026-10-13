import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { ParkedCar } from './ParkedCar'
import { Player } from './Player'
import { keyboardMap } from './controls'
import { Sun } from './Sun'
import { Surface } from './Surface'

export function Experience() {
  return (
    <KeyboardControls map={keyboardMap}>
      <Canvas shadows camera={{ position: [0, 2.5, 5], fov: 50 }}>
        <color attach="background" args={['#87ceeb']} />

        <ambientLight intensity={0.5} />
        <Sun />

        <Surface />

        <Suspense fallback={null}>
          <Player />
          <ParkedCar />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  )
}
