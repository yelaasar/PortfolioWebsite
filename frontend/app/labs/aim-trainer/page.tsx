import type { Metadata } from 'next'
import AimTrainer from '@/games/aim-trainer/react/AimTrainer'

export const metadata: Metadata = {
  title: 'Aim Trainer',
  description: 'A timed target-clicking game built on a small three.js engine.',
}

export default function AimTrainerPage() {
  return <AimTrainer />
}
