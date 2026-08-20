import type { PayslipResult } from "@/lib/types";

export type MemberPayoutSummary = {
  memberId: string;
  handle: string;
  grossPayout: number;
  transferFeesDeducted: number;
  netPayout: number;
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

  for (const transfer of result.suggestedTransfers) {
    feeByRecipient.set(
      transfer.toMemberId,
      (feeByRecipient.get(transfer.toMemberId) ?? 0) + transfer.feeAmount
    );
  }

  return result.members.map((member) => {
    const transferFeesDeducted = feeByRecipient.get(member.memberId) ?? 0;
    return {
      memberId: member.memberId,
      handle: member.handle,
      grossPayout: member.finalNet,
      transferFeesDeducted,
      netPayout: member.finalNet - transferFeesDeducted,
    };
  });
}
