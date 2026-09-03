'use client'

import { Suspense, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import TileBox from './gameComponents/TileBox'
import styles from './AimTrainer.module.css'

const NUM_OF_BOXES = 3

// The counter used to sit at a hardcoded x of 5.8 world units, which falls
// outside the frustum at most aspect ratios — the score was unreadable.
// Anchoring to the measured viewport keeps it in the top-right corner at any
// window size.
function Counter({ value }: { value: number }) {
  const { viewport } = useThree()

  return (
    <Text
      position={[viewport.width / 2 - 0.2, viewport.height / 2 - 0.4, 0]}
      anchorX="right"
      anchorY="top"
      fontSize={0.5}
      color="hotpink"
    >
      Counter: {value.toString()}
    </Text>
  )
}

export default function AimTrainer() {
  const [counter, setCounter] = useState(0)

  return (
    <section>
      <div className={styles.canvas}>
        <Canvas className={styles.outline}>
          {/* drei's <Text> fetches a font and suspends; without a boundary the
              canvas is blank until it resolves. */}
          <Suspense fallback={null}>
            <ambientLight intensity={Math.PI / 2} />
            <spotLight
              position={[100, 100, 100]}
              angle={0.15}
              penumbra={1}
              decay={0}
              intensity={Math.PI}
            />
            <pointLight position={[-100, -100, -100]} decay={0} intensity={Math.PI} />

            {Array.from({ length: NUM_OF_BOXES }).map((_, index) => (
              <TileBox key={index} onDeath={() => setCounter((x) => x + 1)} />
            ))}

            <Counter value={counter} />
          </Suspense>
        </Canvas>
      </div>
    </section>
  )
}
