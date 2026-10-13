"use client";
import type { PaidTransferInput, SessionInput } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { NumericInput } from "./ui/numeric-input";
import { generateId } from "@/lib/id";

type Props = { session: SessionInput; lang: Lang; onChange: (transfers: PaidTransferInput[]) => void };
export function PaidTransfersEditor({ session, lang, onChange }: Props) {
  const de = lang === "de";
  const rows = session.paidTransfers ?? [];
  const update = (index: number, patch: Partial<PaidTransferInput>) => onChange(rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  const members = session.members.filter(m => m.id);
  return <section className="glass p-6 space-y-3" aria-label={de ? "Erfasste Transfers" : "Recorded transfers"}>
    <h3 className="text-xl">{de ? "Bereits gezahlt / Vorschüsse / Kostenbeteiligung" : "Already paid / advances / cost contributions"}</h3>
    <p className="text-sm text-white/70">{de ? "Umsatz bleibt der gehaltene Erlös VOR diesen Transfers. Sind Zahlungen schon im Umsatzbestand enthalten, nicht erneut erfassen: erst ursprüngliche Bestände zurückrechnen. Kosten immer vollständig beim Käufer erfassen." : "Revenue stays the proceeds held BEFORE these transfers. Do not record payments already included in revenue holdings: reconstruct original holdings first. Record buyer costs in full."}</p>
    <p className="text-sm text-white/70">{de ? "Ausgleich: Gebühr im Empfängeranspruch. Session-Geld: verschiebt Nettobestände, Gebühr mindert Gewinn einmal. Externe Kostenbeteiligung: eigenes Geld finanziert Investment/Auslagen eines anderen, Erstattung wechselt zum Geldgeber; Gebühr wird ebenfalls erstattet. Keine zusätzliche Investmentzeile beim Geldgeber." : "Settlement: fee consumes recipient entitlement. Session cash: moves net holdings, fee reduces profit once. External cost contribution: personal money funds another member's investment/expenses; reimbursement moves to funder, including fee. Do not add another investment row for the funder."}</p>
    {rows.map((row, index) => <div key={row.id ?? index} className="grid gap-2 md:grid-cols-3 border-t border-white/10 pt-3">
      <label>{de ? "Bezeichnung" : "Label"}<input className="input w-full" aria-label={`Transfer label ${index + 1}`} value={row.label ?? ""} onChange={e => update(index, { label: e.target.value })} /></label>
      <label>{de ? "Von" : "From"}<select className="input w-full" aria-label={`Transfer from ${index + 1}`} value={row.fromMemberId} onChange={e => update(index, { fromMemberId: e.target.value })}>{members.map(m => <option key={m.id} value={m.id}>{m.handle}</option>)}</select></label>
      <label>{de ? "An" : "To"}<select className="input w-full" aria-label={`Transfer to ${index + 1}`} value={row.toMemberId} onChange={e => update(index, { toMemberId: e.target.value })}>{members.map(m => <option key={m.id} value={m.id}>{m.handle}</option>)}</select></label>
      <label>{de ? "Art" : "Kind"}<select className="input w-full" aria-label={`Transfer kind ${index + 1}`} value={row.kind ?? "SETTLEMENT"} onChange={e => update(index, { kind: e.target.value as PaidTransferInput["kind"] })}>
        <option value="SETTLEMENT">{de ? "Ausgleich / Auszahlung" : "Settlement / payout"}</option>
        <option value="SESSION_CASH">{de ? "Vorschuss aus Session-Geld" : "Advance from session cash"}</option>
        <option value="COST_CONTRIBUTION">{de ? "Externe Kostenbeteiligung" : "External cost contribution"}</option>
      </select></label>
      <label>{de ? "Netto erhalten" : "Net received"}<NumericInput lang={lang} aria-label={`Transfer net ${index + 1}`} value={row.netAmount} onValueChange={value => update(index, { netAmount: value })} /></label>
      <label>{de ? "Bezahlte Gebühr" : "Paid fee"}<NumericInput lang={lang} aria-label={`Transfer fee ${index + 1}`} value={row.feeAmount} onValueChange={value => update(index, { feeAmount: value })} /></label>
      <p>{de ? "Belastung" : "Charged"}: {row.netAmount} + {row.feeAmount} = {row.netAmount + row.feeAmount}</p>
      <button className="btn" aria-label={`Remove transfer ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}>{de ? "Entfernen" : "Remove"}</button>
    </div>)}
    <button className="btn" disabled={members.length < 2} onClick={() => onChange([...rows, { id: generateId(), label: "", fromMemberId: members[0].id!, toMemberId: members[1].id!, netAmount: 0, feeAmount: 0, kind: "SETTLEMENT" }])}>{de ? "+ Transfer erfassen" : "+ Record transfer"}</button>
  </section>;
}
