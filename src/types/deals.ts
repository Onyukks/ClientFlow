export type DealsMetric = {
  accent: string;
  change: string;
  label: string;
  note: string;
  tint: string;
  value: string;
};

export type DealClientOption = {
  id: string;
  name: string;
};

export type DealEditValues = {
  clientId: string;
  dealId: string;
  expectedCloseDate: string;
  probability: string;
  stage: string;
  title: string;
  value: string;
};

export type DealListItem = {
  clientId: string;
  clientName: string;
  closeDate: string;
  contact: string;
  editValues: DealEditValues;
  id: string;
  probability: string;
  stage: string;
  stageColor: string;
  title: string;
  value: string;
  weightedValue: string;
};

export type DealStageGroup = {
  count: string;
  deals: DealListItem[];
  label: string;
  totalValue: string;
};

export type DealsData = {
  clientOptions: DealClientOption[];
  deals: DealListItem[];
  metrics: DealsMetric[];
  stageGroups: DealStageGroup[];
};
