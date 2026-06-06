export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
  note: string;
  accent: string;
  tint: string;
};

export type DashboardDeal = {
  company: string;
  contact: string;
  stage: string;
  value: string;
  probability: string;
  color: string;
};

export type DashboardTask = {
  title: string;
  owner: string;
  due: string;
  priority: string;
};

export type DashboardActivity = {
  message: string;
  meta: string;
};

export type DashboardSummary = {
  pipelineValue: string;
  weightedPipelineValue: string;
  revenueHeadline: string;
  expectedCloseValue: string;
  hotAccounts: string;
  dueToday: string;
  targetProgress: number;
  targetProgressLabel: string;
  chartBars: number[];
  alertCount: number;
};

export type DashboardSubscription = {
  plan: string;
  status: string;
  price: string;
  note: string;
};

export type DashboardData = {
  workspaceName: string;
  metrics: DashboardMetric[];
  pipeline: DashboardDeal[];
  tasks: DashboardTask[];
  activity: DashboardActivity[];
  summary: DashboardSummary;
  subscription: DashboardSubscription;
};
