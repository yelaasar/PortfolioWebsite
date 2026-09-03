import type { Metadata } from 'next'
import AimTrainerCanvas from '@/components/AimTrainer/AimTrainerCanvas'

export const metadata: Metadata = {
  title: 'Aim Trainer',
  description: 'A small react-three-fiber target-clicking game.',
}

export default function AimTrainerPage() {
  return <AimTrainerCanvas />
}
