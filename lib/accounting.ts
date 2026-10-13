import type { PayslipResult, SessionInput, MemberInput } from "./types";
import { buildArithmeticSections } from "./arithmeticSections";
import type { Lang } from "./i18n/translations";

export function memberAmount(member: MemberInput, kind: "revenue" | "investment"): number {
  const items = kind === "revenue" ? member.revenues : member.investments;
  return items ? items.reduce((sum, item) => sum + item.amount, 0) : member[kind] ?? 0;
}

export { buildArithmeticSections } from "./arithmeticSections";
export type { ArithmeticSection } from "./arithmeticSections";

/** Shared by UI and PDF: the sections as a flat list, each title followed by its lines. */
export function buildArithmeticExplanation(session: SessionInput, result: PayslipResult, lang: Lang): string[] {
  return buildArithmeticSections(session, result, lang).flatMap((section) => [section.title, ...section.lines]);
}
