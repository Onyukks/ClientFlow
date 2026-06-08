import type {
  ActivityType,
  ClientStatus,
  DealStage,
  SubscriptionPlan,
  SubscriptionStatus,
  TaskPriority,
  TaskStatus,
} from "@/generated/prisma/client";

// Raw JSON contract for the React Native companion app.
// Unlike the web view-models in ./clients, ./deals, ./tasks (which return
// formatted currency strings and Tailwind classes), these return raw values:
// numbers stay numbers, dates are ISO 8601 strings, enums keep their DB value.

export type MobileUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type MobileWorkspace = {
  id: string;
  name: string;
  slug: string;
};

export type MobileAuthResponse = {
  token: string;
  user: MobileUser;
  workspace: MobileWorkspace;
};

export type MobileContact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
};

export type MobileClientSummary = {
  id: string;
  name: string;
  status: ClientStatus;
  industry: string | null;
  website: string | null;
  estimatedValue: number;
  pipelineValue: number;
  openDeals: number;
  openTasks: number;
  primaryContact: MobileContact | null;
  updatedAt: string;
};

export type MobileDealSummary = {
  id: string;
  title: string;
  stage: DealStage;
  value: number;
  probability: number;
  weightedValue: number;
  expectedCloseDate: string | null;
  clientId: string;
  clientName: string;
  updatedAt: string;
};

export type MobileTaskSummary = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  clientId: string | null;
  clientName: string | null;
  dealId: string | null;
  dealTitle: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  updatedAt: string;
};

export type MobileActivity = {
  id: string;
  type: ActivityType;
  message: string;
  actor: string | null;
  createdAt: string;
};

export type MobileClientDetail = MobileClientSummary & {
  contacts: MobileContact[];
  deals: MobileDealSummary[];
  tasks: MobileTaskSummary[];
  activities: MobileActivity[];
};

export type MobileDashboard = {
  workspace: { name: string };
  metrics: {
    pipelineValue: number;
    weightedPipelineValue: number;
    openDeals: number;
    activeClients: number;
    newClientsThisWeek: number;
    openTasks: number;
    dueToday: number;
    winConfidence: number;
    hotDeals: number;
  };
  pipeline: MobileDealSummary[];
  tasks: MobileTaskSummary[];
  activity: MobileActivity[];
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
  } | null;
};

export type MobileApiError = {
  error: {
    message: string;
    fields?: Record<string, string>;
  };
};
