export type TasksMetric = {
  accent: string;
  change: string;
  label: string;
  note: string;
  tint: string;
  value: string;
};

export type TaskListItem = {
  clientId: string | null;
  clientName: string;
  dealTitle: string;
  dealValue: string;
  description: string;
  dueLabel: string;
  dueState: string;
  dueStateColor: string;
  id: string;
  owner: string;
  priority: string;
  priorityColor: string;
  status: string;
  statusColor: string;
  title: string;
};

export type TaskStatusGroup = {
  count: string;
  label: string;
  note: string;
  tasks: TaskListItem[];
  tone: string;
};

export type TaskPriorityGroup = {
  barColor: string;
  count: string;
  label: string;
};

export type TasksData = {
  metrics: TasksMetric[];
  priorityGroups: TaskPriorityGroup[];
  statusGroups: TaskStatusGroup[];
  tasks: TaskListItem[];
};
