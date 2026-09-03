'use client'

import dynamic from 'next/dynamic'

// dynamic(..., { ssr: false }) is illegal in a server component, so this thin
// client wrapper exists purely to host it. three.js is heavy and entirely
// client-side, so it stays out of the server render and off every other route.
const AimTrainer = dynamic(() => import('./AimTrainer'), { ssr: false })

export default function AimTrainerCanvas() {
  return <AimTrainer />
}
