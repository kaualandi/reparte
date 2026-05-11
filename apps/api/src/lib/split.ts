import type { Split } from '@reparte/types'

import type { ScanItemRow } from '../db/schema.ts'
import { parseBRL, round2 } from './money.ts'

export function computeSplit(scanId: string, items: ScanItemRow[]): Split {
  let totalUser1 = 0
  let totalUser2 = 0
  let totalShared = 0

  for (const item of items) {
    const value = parseBRL(item.valorTotal)
    if (item.owner === 'user1') totalUser1 += value
    else if (item.owner === 'user2') totalUser2 += value
    else if (item.owner === 'shared') totalShared += value
  }

  const halfShared = totalShared / 2
  return {
    scanId,
    totalUser1: round2(totalUser1),
    totalUser2: round2(totalUser2),
    totalShared: round2(totalShared),
    deveUser1: round2(totalUser1 + halfShared),
    deveUser2: round2(totalUser2 + halfShared),
  }
}
