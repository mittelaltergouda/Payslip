"use client";
import type { MemberInput, MoneyItemInput } from "@/lib/types";
import { NumericInput } from "./ui/numeric-input";
import { generateId } from "@/lib/id";
import { memberAmount } from "@/lib/accounting";
import type { Lang } from "@/lib/i18n/translations";

type Props = { member: MemberInput; kind: "revenue" | "investment"; lang: Lang; onChange: (patch: Partial<MemberInput>) => void; rowIndex?: number };
export function MoneyItemsEditor({ member, kind, lang, onChange, rowIndex }: Props) {
  const field = kind === "revenue" ? "revenues" : "investments";
  const title = lang === "de" ? (kind === "revenue" ? "Umsatz" : "Investment") : kind;
  const items = member[field];
  const update = (rows: MoneyItemInput[]) => onChange({ [field]: rows, [kind]: rows.reduce((sum, row) => sum + row.amount, 0) });
  const add = () => {
    const existing = items ?? [{ id: generateId(), label: lang === "de" ? "Bisheriger Betrag" : "Previous amount", amount: member[kind] ?? 0 }];
    update([...existing, { id: generateId(), label: title, amount: 0 }]);
  };
  return <div className="space-y-2 min-w-[220px]" role="group" aria-label={`${title} ${member.handle}`}>
    {!items && <NumericInput value={member[kind] ?? 0} lang={lang} data-nav-col={kind} data-nav-row={rowIndex} aria-label={`${title} ${member.handle}`} onValueChange={value => onChange({ [kind]: value })} />}
    {items?.map((item, index) => <div key={item.id ?? index} className="flex gap-2 items-center">
      <input className="input min-w-0 flex-1" aria-label={`${kind} label ${index + 1}`} value={item.label} onChange={e => update(items.map((row, i) => i === index ? { ...row, label: e.target.value } : row))} />
      <NumericInput className="w-28" lang={lang} aria-label={`${kind} amount ${index + 1}`} value={item.amount} onValueChange={value => update(items.map((row, i) => i === index ? { ...row, amount: value } : row))} />
      <button type="button" aria-label={`Remove ${kind} ${index + 1}`} className="text-red-400" onClick={() => update(items.filter((_, i) => i !== index))}>🗑</button>
    </div>)}
    <button type="button" className="btn text-xs" aria-label={`Add ${kind}`} onClick={add}>+ {title}</button>
    {items && <p className="text-xs text-white/60">Σ {memberAmount(member, kind).toLocaleString(lang)}</p>}
  </div>;
}
