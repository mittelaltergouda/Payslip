import type { PayslipResult } from "@/lib/types";

export type MemberPayoutSummary = {
  memberId: string;
  handle: string;
  grossPayout: number;
  transferFeesDeducted: number;
  netPayout: number;
  unsettledAmount?: number;
};

/**
 * Derives the payout a member actually receives after transfer fees.
 *
 * Transfer fees fit inside the recipient's gross transfer entitlement, so the
 * fee reduces the recipient's payout rather than being subtracted again from
 * the sender's finalNet value.
 */
export function getMemberPayoutSummaries(
  result: PayslipResult
): MemberPayoutSummary[] {
  const feeByRecipient = new Map<string, number>();
  const projectedHoldingByMember = new Map(
    result.members.map((member) => [member.memberId, member.revenue])
  );
  const unsettledByMember = new Map(
    (result.unsettledBalances ?? []).map((balance) => [balance.memberId, balance.amount])
  );

  for (const transfer of result.suggestedTransfers) {
    feeByRecipient.set(
      transfer.toMemberId,
      (feeByRecipient.get(transfer.toMemberId) ?? 0) + transfer.feeAmount
    );
    projectedHoldingByMember.set(
      transfer.fromMemberId,
      (projectedHoldingByMember.get(transfer.fromMemberId) ?? 0) - transfer.grossAmount
    );
    projectedHoldingByMember.set(
      transfer.toMemberId,
      (projectedHoldingByMember.get(transfer.toMemberId) ?? 0) + transfer.netAmount
    );
  }

  return result.members.map((member) => {
    const transferFeesDeducted = feeByRecipient.get(member.memberId) ?? 0;
    const unsettledAmount = unsettledByMember.get(member.memberId) ?? 0;
    const summary: MemberPayoutSummary = {
      memberId: member.memberId,
      handle: member.handle,
      grossPayout: member.finalNet,
      transferFeesDeducted,
      netPayout: projectedHoldingByMember.get(member.memberId) ?? member.revenue,
    };
    if (Math.abs(unsettledAmount) > 0.01) {
      summary.unsettledAmount = unsettledAmount;
    }
    return summary;
  });
}
