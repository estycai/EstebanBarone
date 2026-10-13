import type { CSSProperties } from 'react'
import { Experience } from './components/scene/Experience'

const overlayStyle: CSSProperties = {
  position: 'fixed',
  left: 16,
  bottom: 16,
  color: '#ffffff',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 14,
  pointerEvents: 'none',
  userSelect: 'none',
}

function App() {
  return (
    <>
      <Experience />
      <div style={overlayStyle}>WASD to walk</div>
    </>
  )
}

export default App
