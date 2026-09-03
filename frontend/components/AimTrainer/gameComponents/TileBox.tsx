import { useRef, useState } from 'react'
import type { Mesh } from 'three'

const randomBetween = (min: number, max: number) =>
  // toFixed returns a *string*; without Number() the position tuple was
  // [string, string, number].
  Number((Math.random() * (max - min) + min).toFixed(3))

const randomPosition = (): [number, number, number] => [
  randomBetween(-6, 6),
  randomBetween(-3, 3),
  0,
]

export default function TileBox({ onDeath }: { onDeath: () => void }) {
  const ref = useRef<Mesh>(null)
  const [hovered, hover] = useState(false)
  const [position, setPosition] = useState<[number, number, number]>(randomPosition)

  // Previously this lived in the render body behind an `if (clicked)`, which
  // called the parent's setState during render — React 19 rejects that.
  const handleClick = () => {
    setPosition(randomPosition())
    onDeath()
  }

  return (
    <mesh
      position={position}
      ref={ref}
      onClick={handleClick}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
    >
      <boxGeometry args={[1, 1, 0.5]} />
      <meshStandardMaterial color={hovered ? 'blue' : 'red'} />
    </mesh>
  )
}
