import { DealStage } from "@/generated/prisma/client";
import type {
  MobileActivity,
  MobileClientSummary,
  MobileContact,
  MobileDealSummary,
  MobileTaskSummary,
} from "@/types/mobile";

// Prisma Decimal serializes to a string/object; Number() normalizes it.
const toNumber = (value: unknown): number => Number(value ?? 0);
const toIso = (value: Date | null | undefined): string | null => (value ? value.toISOString() : null);

const OPEN_STAGES = new Set<DealStage>([
  DealStage.QUALIFIED,
  DealStage.DISCOVERY,
  DealStage.PROPOSAL,
  DealStage.NEGOTIATION,
]);

export const isOpenStage = (stage: DealStage): boolean => OPEN_STAGES.has(stage);

type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
};

export const serializeContact = (contact: ContactRow): MobileContact => ({
  id: contact.id,
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  title: contact.title,
});

type ClientRow = {
  id: string;
  name: string;
  status: MobileClientSummary["status"];
  industry: string | null;
  website: string | null;
  estimatedValue: unknown;
  updatedAt: Date;
  contacts: ContactRow[];
  deals: { stage: DealStage; value: unknown }[];
  tasks: { id: string }[];
};

export const serializeClientSummary = (client: ClientRow): MobileClientSummary => {
  const openDeals = client.deals.filter((deal) => isOpenStage(deal.stage));
  const pipelineValue = openDeals.reduce((total, deal) => total + toNumber(deal.value), 0);
  const primaryContact = client.contacts[0];

  return {
    id: client.id,
    name: client.name,
    status: client.status,
    industry: client.industry,
    website: client.website,
    estimatedValue: toNumber(client.estimatedValue),
    pipelineValue,
    openDeals: openDeals.length,
    openTasks: client.tasks.length,
    primaryContact: primaryContact ? serializeContact(primaryContact) : null,
    updatedAt: client.updatedAt.toISOString(),
  };
};

type DealRow = {
  id: string;
  title: string;
  stage: DealStage;
  value: unknown;
  probability: number;
  expectedCloseDate: Date | null;
  updatedAt: Date;
  clientId: string;
  client: { name: string };
};

export const serializeDeal = (deal: DealRow): MobileDealSummary => {
  const value = toNumber(deal.value);

  return {
    id: deal.id,
    title: deal.title,
    stage: deal.stage,
    value,
    probability: deal.probability,
    weightedValue: Math.round(value * (deal.probability / 100)),
    expectedCloseDate: toIso(deal.expectedCloseDate),
    clientId: deal.clientId,
    clientName: deal.client.name,
    updatedAt: deal.updatedAt.toISOString(),
  };
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: MobileTaskSummary["status"];
  priority: MobileTaskSummary["priority"];
  dueDate: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
  clientId: string | null;
  client: { name: string } | null;
  dealId: string | null;
  deal: { title: string } | null;
  assigneeId: string | null;
  assignee: { name: string } | null;
};

export const serializeTask = (task: TaskRow): MobileTaskSummary => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: toIso(task.dueDate),
  completedAt: toIso(task.completedAt),
  clientId: task.clientId,
  clientName: task.client?.name ?? null,
  dealId: task.dealId,
  dealTitle: task.deal?.title ?? null,
  assigneeId: task.assigneeId,
  assigneeName: task.assignee?.name ?? null,
  updatedAt: task.updatedAt.toISOString(),
});

type ActivityRow = {
  id: string;
  type: MobileActivity["type"];
  message: string;
  createdAt: Date;
  actor: { name: string } | null;
};

export const serializeActivity = (activity: ActivityRow): MobileActivity => ({
  id: activity.id,
  type: activity.type,
  message: activity.message,
  actor: activity.actor?.name ?? null,
  createdAt: activity.createdAt.toISOString(),
});
