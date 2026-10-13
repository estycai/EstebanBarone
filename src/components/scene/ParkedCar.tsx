import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { Mesh } from 'three'
import { PARKED_CAR } from './mapLayout'

const MODEL_URL = '/models/vw_fox.glb'

// Wheels rest on y = 0, so lift the car onto the road surface.
const ROAD_SURFACE_Y = 0.01

export function ParkedCar() {
  const { scene } = useGLTF(MODEL_URL)

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  return (
    <primitive
      object={scene}
      position={[PARKED_CAR.x, ROAD_SURFACE_Y, PARKED_CAR.z]}
      rotation-y={PARKED_CAR.yaw}
    />
  )
}

useGLTF.preload(MODEL_URL)
