export type ClientsMetric = {
  accent: string;
  change: string;
  label: string;
  note: string;
  tint: string;
  value: string;
};

export type ClientListItem = {
  estimatedValue: string;
  id: string;
  industry: string;
  name: string;
  openDeals: string;
  openTasks: string;
  pipelineValue: string;
  primaryContact: string;
  primaryContactEmail: string;
  status: string;
  statusColor: string;
  updatedAt: string;
  website: string;
};

export type ClientsData = {
  clients: ClientListItem[];
  metrics: ClientsMetric[];
};
