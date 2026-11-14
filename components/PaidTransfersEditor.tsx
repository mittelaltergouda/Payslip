"use client";
import type { PaidTransferInput, SessionInput } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { NumericInput } from "./ui/numeric-input";
import { generateId } from "@/lib/id";
import { format } from "@/lib/format";
import { SERVICE_FEE_RATE } from "@/lib/calc/tax";
import { isServiceFeeIncluded, withServiceFee } from "@/lib/accounting";

type Props = { session: SessionInput; lang: Lang; onChange: (transfers: PaidTransferInput[]) => void };

export function PaidTransfersEditor({ session, lang, onChange }: Props) {
  const de = lang === "de";
  const rows = session.paidTransfers ?? [];
  const currency = session.currency ?? "aUEC";
  const rate = session.taxRate ?? SERVICE_FEE_RATE;
  const ratePercent = (rate * 100).toLocaleString(de ? "de-DE" : "en-US");
  const update = (index: number, patch: Partial<PaidTransferInput>) => onChange(rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  const setFee = (index: number, netAmount: number, feeIncluded: boolean) => update(index, withServiceFee(netAmount, feeIncluded, rate));
  const members = session.members.filter(m => m.id);
  // Sender and recipient must differ; pick the first other member as recipient.
  const otherMember = (id: string) => members.find(m => m.id !== id)?.id ?? id;
  return <section className="glass p-6 space-y-3" aria-label={de ? "Erfasste Transfers" : "Recorded transfers"}>
    <h3 className="text-xl">{de ? "Bereits erfolgte Überweisungen" : "Transfers already made"}</h3>
    {rows.map((row, index) => {
      const feeIncluded = isServiceFeeIncluded(row);
      return <div key={row.id ?? index} className="grid gap-2 md:grid-cols-3 border-t border-white/10 pt-3">
        <label>{de ? "Bezeichnung" : "Label"}<input className="input w-full" aria-label={`Transfer label ${index + 1}`} value={row.label ?? ""} onChange={e => update(index, { label: e.target.value })} /></label>
        <label>{de ? "Von" : "From"}<select className="input w-full" aria-label={`Transfer from ${index + 1}`} value={row.fromMemberId} onChange={e => update(index, { fromMemberId: e.target.value, toMemberId: e.target.value === row.toMemberId ? otherMember(e.target.value) : row.toMemberId })}>{members.map(m => <option key={m.id} value={m.id}>{m.handle}</option>)}</select></label>
        <label>{de ? "An" : "To"}<select className="input w-full" aria-label={`Transfer to ${index + 1}`} value={row.toMemberId} onChange={e => update(index, { toMemberId: e.target.value })}>{members.filter(m => m.id !== row.fromMemberId).map(m => <option key={m.id} value={m.id}>{m.handle}</option>)}</select></label>
        <label>{de ? "Art" : "Kind"}<select className="input w-full" aria-label={`Transfer kind ${index + 1}`} value={row.kind ?? "SETTLEMENT"} onChange={e => update(index, { kind: e.target.value as PaidTransferInput["kind"] })}>
          <option value="SETTLEMENT">{de ? "Ausgleich / Auszahlung" : "Settlement / payout"}</option>
          <option value="SESSION_CASH">{de ? "Vorschuss aus Session-Geld" : "Advance from session cash"}</option>
          <option value="COST_CONTRIBUTION">{de ? "Externe Kostenbeteiligung" : "External cost contribution"}</option>
        </select></label>
        <label>{de ? "Betrag" : "Amount"}<NumericInput lang={lang} aria-label={`Transfer amount ${index + 1}`} value={row.netAmount} onValueChange={value => setFee(index, value, feeIncluded)} /></label>
        <label className="flex items-center gap-2 md:pt-6">
          <input type="checkbox" aria-label={`Transfer service fee ${index + 1}`} checked={feeIncluded} onChange={e => setFee(index, row.netAmount, e.target.checked)} />
          <span className="text-sm text-white/80">{de ? `${ratePercent} % Service Fee berücksichtigen` : `Include ${ratePercent} % service fee`}</span>
        </label>
        <p className="text-sm text-white/80 md:col-span-2 self-center" aria-label={`Transfer total cost ${index + 1}`}>
          Service Fee: {format(row.feeAmount, lang)} {currency} · {de ? "Gesamtkosten" : "Total Cost"}: <span className="font-semibold">{format(row.netAmount + row.feeAmount, lang)} {currency}</span>
        </p>
        <button className="btn" aria-label={`Remove transfer ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}>{de ? "Entfernen" : "Remove"}</button>
      </div>;
    })}
    <button className="btn" disabled={members.length < 2} onClick={() => onChange([...rows, { id: generateId(), label: "", fromMemberId: members[0].id!, toMemberId: members[1].id!, netAmount: 0, feeAmount: 0, feeIncluded: session.taxEnabled ?? true, kind: "SETTLEMENT" }])}>{de ? "+ Transfer erfassen" : "+ Record transfer"}</button>
  </section>;
}
