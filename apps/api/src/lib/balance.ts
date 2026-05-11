import type { MonthlyBalance, Scanner, ScanBalance } from '@reparte/types'

import type { ScanItemRow, ScanRow } from '../db/schema.ts'
import { parseBRL, round2 } from './money.ts'

function otherUser(payer: Scanner): Scanner {
  return payer === 'user1' ? 'user2' : 'user1'
}

export function computeScanBalance(scan: ScanRow, items: ScanItemRow[]): ScanBalance {
  const payer = scan.paidBy as Scanner
  const other = otherUser(payer)

  let ownOfPayer = 0
  let ownOfOther = 0
  let sharedTotal = 0
  let unassignedTotal = 0

  for (const item of items) {
    const value = parseBRL(item.valorTotal)
    if (item.owner === payer) ownOfPayer += value
    else if (item.owner === other) ownOfOther += value
    else if (item.owner === 'shared') sharedTotal += value
    else unassignedTotal += value
  }

  const otherOwesPayer = ownOfOther + sharedTotal / 2

  return {
    scanId: scan.id,
    emitente: scan.emitente,
    createdAt: scan.createdAt.toISOString(),
    total: scan.total,
    paidBy: payer,
    scannedBy: scan.scannedBy as Scanner,
    ownOfPayer: round2(ownOfPayer),
    ownOfOther: round2(ownOfOther),
    sharedTotal: round2(sharedTotal),
    unassignedTotal: round2(unassignedTotal),
    otherOwesPayer: round2(otherOwesPayer),
  }
}

export function computeMonthlyBalance(
  month: string,
  pairs: { scan: ScanRow; items: ScanItemRow[] }[],
): MonthlyBalance {
  const breakdown = pairs.map((p) => computeScanBalance(p.scan, p.items))

  let user1OwesUser2 = 0
  let user2OwesUser1 = 0
  for (const s of breakdown) {
    if (s.paidBy === 'user1') user2OwesUser1 += s.otherOwesPayer
    else user1OwesUser2 += s.otherOwesPayer
  }

  user1OwesUser2 = round2(user1OwesUser2)
  user2OwesUser1 = round2(user2OwesUser1)

  let netDebtor: Scanner | null = null
  let netCreditor: Scanner | null = null
  let netAmount = 0
  if (user1OwesUser2 > user2OwesUser1) {
    netDebtor = 'user1'
    netCreditor = 'user2'
    netAmount = round2(user1OwesUser2 - user2OwesUser1)
  } else if (user2OwesUser1 > user1OwesUser2) {
    netDebtor = 'user2'
    netCreditor = 'user1'
    netAmount = round2(user2OwesUser1 - user1OwesUser2)
  }

  return {
    month,
    scans: breakdown,
    user1OwesUser2,
    user2OwesUser1,
    netDebtor,
    netCreditor,
    netAmount,
  }
}
