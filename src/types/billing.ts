export type BillingMetric = {
  accent: string;
  change: string;
  label: string;
  note: string;
  tint: string;
  value: string;
};

export type BillingUsageItem = {
  color: string;
  label: string;
  limit: string;
  percent: number;
  value: string;
};

export type BillingPlanCard = {
  checkoutEnabled: boolean;
  cta: string;
  description: string;
  features: string[];
  highlighted: boolean;
  name: string;
  planKey: string;
  price: string;
};

export type BillingHistoryItem = {
  amount: string;
  date: string;
  id: string;
  label: string;
  status: string;
  statusColor: string;
};

export type BillingMember = {
  email: string;
  name: string;
  role: string;
};

export type BillingData = {
  canManageBilling: boolean;
  currentPlan: string;
  currentPrice: string;
  history: BillingHistoryItem[];
  members: BillingMember[];
  metrics: BillingMetric[];
  paymentMode: string;
  planCards: BillingPlanCard[];
  renewalDate: string;
  status: string;
  statusColor: string;
  stripeConfigured: boolean;
  summary: string;
  usage: BillingUsageItem[];
};
