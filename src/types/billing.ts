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
  cta: string;
  description: string;
  features: string[];
  highlighted: boolean;
  name: string;
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
  summary: string;
  usage: BillingUsageItem[];
};
