import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { Player } from './Player'
import { keyboardMap } from './controls'
import { MAP_SIZE, Surface } from './Surface'

// Shadow frustum covers the whole map plus a small margin.
const SHADOW_EXTENT = MAP_SIZE / 2 + 2

export function Experience() {
  return (
    <KeyboardControls map={keyboardMap}>
      <Canvas shadows camera={{ position: [0, 2.5, 5], fov: 50 }}>
        <color attach="background" args={['#87ceeb']} />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-SHADOW_EXTENT}
          shadow-camera-right={SHADOW_EXTENT}
          shadow-camera-top={SHADOW_EXTENT}
          shadow-camera-bottom={-SHADOW_EXTENT}
        />

        <Surface />

        <Suspense fallback={null}>
          <Player />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  )
}
