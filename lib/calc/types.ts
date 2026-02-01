import {
  DistributionMode,
  SharedExpenseInput,
  IndividualExpenseInput,
} from '../types';

/**
 * Normalized member with all fields guaranteed to have values.
 * Used internally after input normalization.
 */
export type NormalizedMember = {
  id: string;
  handle: string;
  role: string;
  active: boolean;
  revenue: number;
  investment: number;
  percentShare: number | null;
  fixedBonus: number | null;
  fixedPayout: number | null;
};

/**
 * Normalized session input with all optional fields resolved to defaults.
 */
export type NormalizedSessionInput = {
  id: string;
  name: string;
  type: string;
  currency: string;
  totalRevenue: number | null;
  distributionMode: DistributionMode;
  taxEnabled: boolean;
  taxRate: number;
  members: NormalizedMember[];
  sharedExpenses: SharedExpenseInput[];
  individualExpenses: IndividualExpenseInput[];
};
