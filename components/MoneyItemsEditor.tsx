"use client";
import type { MemberInput, MoneyItemInput } from "@/lib/types";
import { NumericInput } from "./ui/numeric-input";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { generateId } from "@/lib/id";
import { memberAmount } from "@/lib/accounting";
import { format } from "@/lib/format";
import type { Lang } from "@/lib/i18n/translations";

type Props = {
  member: MemberInput;
  kind: "revenue" | "investment";
  lang: Lang;
  onChange: (patch: Partial<MemberInput>) => void;
  rowIndex?: number;
  /** "row" matches the expense column in the desktop table, "card" the expense section in the mobile card. */
  variant?: "row" | "card";
};

/**
 * Revenue/investment editor that mirrors the expense editor next to it:
 * labelled positions with amount and remove button, a full add button and a Σ line.
 * Without positions the member's single amount stays directly editable.
 */
export function MoneyItemsEditor({ member, kind, lang, onChange, rowIndex, variant = "row" }: Props) {
  const field = kind === "revenue" ? "revenues" : "investments";
  const title = lang === "de" ? (kind === "revenue" ? "Umsatz" : "Investment") : kind;
  const items = member[field];
  const card = variant === "card";
  const update = (rows: MoneyItemInput[]) => onChange({ [field]: rows, [kind]: rows.reduce((sum, row) => sum + row.amount, 0) });
  const add = () => {
    // A legacy single amount becomes the first position; an empty amount must not leave a "0" row behind.
    const legacyAmount = member[kind] ?? 0;
    const existing = items ?? (legacyAmount !== 0 ? [{ id: generateId(), label: lang === "de" ? "Bisheriger Betrag" : "Previous amount", amount: legacyAmount }] : []);
    update([...existing, { id: generateId(), label: title, amount: 0 }]);
  };
  const LabelInput = card ? Input : "input";
  const addLabel = `+ ${title}`;

  return (
    <div className={card ? "space-y-2" : "flex flex-col gap-1 min-w-[220px]"} role="group" aria-label={`${title} ${member.handle}`}>
      {!items && (
        <NumericInput
          className={card ? undefined : "input w-full"}
          value={member[kind] ?? 0}
          lang={lang}
          data-nav-col={kind}
          data-nav-row={rowIndex}
          aria-label={`${title} ${member.handle}`}
          onValueChange={value => onChange({ [kind]: value })}
        />
      )}
      {items?.map((item, index) => (
        <div key={item.id ?? index} className="flex gap-2 items-center">
          <LabelInput
            className={card ? "flex-1" : "input flex-1"}
            aria-label={`${kind} label ${index + 1}`}
            value={item.label}
            onChange={e => update(items.map((row, i) => i === index ? { ...row, label: e.target.value } : row))}
          />
          <NumericInput
            className={card ? "w-24" : "input w-24"}
            lang={lang}
            data-nav-col={index === 0 ? kind : undefined}
            data-nav-row={index === 0 ? rowIndex : undefined}
            aria-label={`${kind} amount ${index + 1}`}
            value={item.amount}
            onValueChange={value => update(items.map((row, i) => i === index ? { ...row, amount: value } : row))}
          />
          {card ? (
            <Button variant="ghost" size="sm" className="text-red-400 h-8 w-8 p-0" aria-label={`Remove ${kind} ${index + 1}`} onClick={() => update(items.filter((_, i) => i !== index))}>
              🗑
            </Button>
          ) : (
            <button type="button" className="text-red-400 text-xl leading-none" aria-label={`Remove ${kind} ${index + 1}`} onClick={() => update(items.filter((_, i) => i !== index))}>
              🗑
            </button>
          )}
        </div>
      ))}
      {card ? (
        <Button size="sm" aria-label={`Add ${kind}`} onClick={add}>{addLabel}</Button>
      ) : (
        <button type="button" className="btn text-xs" aria-label={`Add ${kind}`} onClick={add}>{addLabel}</button>
      )}
      <div className="text-xs text-white/60">Σ {format(memberAmount(member, kind), lang)}</div>
    </div>
  );
}
