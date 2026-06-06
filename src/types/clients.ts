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

export type ClientDetailContact = {
  email: string;
  id: string;
  name: string;
  phone: string;
  title: string;
};

export type ClientDetailDeal = {
  expectedCloseDate: string;
  id: string;
  probability: string;
  stage: string;
  stageColor: string;
  title: string;
  value: string;
};

export type ClientDetailTask = {
  description: string;
  due: string;
  id: string;
  priority: string;
  priorityColor: string;
  status: string;
  title: string;
};

export type ClientDetailActivity = {
  actor: string;
  date: string;
  id: string;
  message: string;
  type: string;
};

export type ClientDetailMetric = {
  label: string;
  note: string;
  value: string;
};

export type ClientEditValues = {
  clientId: string;
  contactEmail: string;
  contactId: string;
  contactName: string;
  contactTitle: string;
  estimatedValue: string;
  industry: string;
  name: string;
  status: string;
  website: string;
};

export type ClientDetailData = {
  activities: ClientDetailActivity[];
  contacts: ClientDetailContact[];
  deals: ClientDetailDeal[];
  editValues: ClientEditValues;
  estimatedValue: string;
  id: string;
  industry: string;
  metrics: ClientDetailMetric[];
  name: string;
  status: string;
  statusColor: string;
  tasks: ClientDetailTask[];
  updatedAt: string;
  website: string;
};
