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
 * Derives each member's payout and their part of the service fees.
 *
 * Service fees of all transfers are a shared session cost: they are already
 * deducted from profit before the split, so a recipient gets the whole amount
 * and the sender pays the fee on top. transferFeesDeducted is the member's
 * share of those fees (already inside finalNet), grossPayout the payout before it.
 */
export function getMemberPayoutSummaries(
  result: PayslipResult
): MemberPayoutSummary[] {
  const projectedHoldingByMember = new Map(
    result.members.map((member) => [member.memberId, member.revenue])
  );
  const unsettledByMember = new Map(
    (result.unsettledBalances ?? []).map((balance) => [balance.memberId, balance.amount])
  );
  const move = (fromMemberId: string, toMemberId: string, netAmount: number, feeAmount: number) => {
    projectedHoldingByMember.set(fromMemberId, (projectedHoldingByMember.get(fromMemberId) ?? 0) - netAmount - feeAmount);
    projectedHoldingByMember.set(toMemberId, (projectedHoldingByMember.get(toMemberId) ?? 0) + netAmount);
  };

  // Cost contributions were outside money and leave session holdings alone.
  for (const transfer of result.paidTransfers ?? []) {
    if (transfer.kind === "COST_CONTRIBUTION") {continue;}
    move(transfer.fromMemberId, transfer.toMemberId, transfer.netAmount, transfer.feeAmount);
  }
  for (const transfer of result.suggestedTransfers) {
    move(transfer.fromMemberId, transfer.toMemberId, transfer.netAmount, transfer.feeAmount);
  }

  return result.members.map((member) => {
    const transferFeesDeducted = member.serviceFeeShare ?? 0;
    const unsettledAmount = unsettledByMember.get(member.memberId) ?? 0;
    const summary: MemberPayoutSummary = {
      memberId: member.memberId,
      handle: member.handle,
      grossPayout: member.finalNet + transferFeesDeducted,
      transferFeesDeducted,
      netPayout: projectedHoldingByMember.get(member.memberId) ?? member.revenue,
    };
    if (Math.abs(unsettledAmount) > 0.01) {
      summary.unsettledAmount = unsettledAmount;
    }
    return summary;
  });
}
