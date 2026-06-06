import { TaskPriority, TaskStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { TaskListItem, TaskPriorityGroup, TasksData, TaskStatusGroup } from "@/types/tasks";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 1,
  notation: "compact",
  style: "currency",
});

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "To do",
  [TaskStatus.IN_PROGRESS]: "In progress",
  [TaskStatus.DONE]: "Done",
};

const statusStyles: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "bg-blue-50 text-blue-700",
  [TaskStatus.IN_PROGRESS]: "bg-amber-50 text-amber-700",
  [TaskStatus.DONE]: "bg-emerald-50 text-emerald-700",
};

const statusTones: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "border-blue-200 bg-blue-50/45",
  [TaskStatus.IN_PROGRESS]: "border-amber-200 bg-amber-50/55",
  [TaskStatus.DONE]: "border-emerald-200 bg-emerald-50/55",
};

const statusNotes: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "Ready to pick up",
  [TaskStatus.IN_PROGRESS]: "Currently moving",
  [TaskStatus.DONE]: "Recently completed",
};

const priorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: "High",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.LOW]: "Low",
};

const priorityStyles: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: "bg-rose-50 text-rose-700",
  [TaskPriority.MEDIUM]: "bg-amber-50 text-amber-700",
  [TaskPriority.LOW]: "bg-slate-100 text-slate-700",
};

const priorityBars: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: "bg-rose-500",
  [TaskPriority.MEDIUM]: "bg-amber-500",
  [TaskPriority.LOW]: "bg-slate-500",
};

const statusOrder = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
const priorityOrder = [TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW];

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatCompactCurrency = (value: number) => compactCurrencyFormatter.format(value);

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatDueLabel = (dueDate: Date | null) => {
  if (!dueDate) {
    return "No date";
  }

  const today = startOfDay(new Date());
  const due = startOfDay(dueDate);
  const tomorrow = addDays(today, 1);

  if (due.getTime() === today.getTime()) {
    return "Today";
  }

  if (due.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  return dueDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getDueState = (dueDate: Date | null, status: TaskStatus) => {
  if (status === TaskStatus.DONE) {
    return {
      label: "Completed",
      color: "bg-emerald-50 text-emerald-700",
    };
  }

  if (!dueDate) {
    return {
      label: "No date",
      color: "bg-slate-100 text-slate-700",
    };
  }

  const today = startOfDay(new Date());
  const due = startOfDay(dueDate);
  const differenceInDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (differenceInDays < 0) {
    return {
      label: "Overdue",
      color: "bg-rose-50 text-rose-700",
    };
  }

  if (differenceInDays === 0) {
    return {
      label: "Due today",
      color: "bg-amber-50 text-amber-700",
    };
  }

  if (differenceInDays === 1) {
    return {
      label: "Tomorrow",
      color: "bg-blue-50 text-blue-700",
    };
  }

  if (differenceInDays <= 7) {
    return {
      label: "This week",
      color: "bg-violet-50 text-violet-700",
    };
  }

  return {
    label: "Upcoming",
    color: "bg-slate-100 text-slate-700",
  };
};

export async function getTasksData(workspaceId: string): Promise<TasksData> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const weekEnd = addDays(todayStart, 7);

  const tasks = await prisma.task.findMany({
    where: {
      workspaceId,
    },
    include: {
      assignee: {
        select: {
          name: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
        },
      },
      deal: {
        select: {
          id: true,
          title: true,
          value: true,
        },
      },
    },
    orderBy: [
      {
        dueDate: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const mappedTasks: TaskListItem[] = tasks.map((task) => {
    const dueState = getDueState(task.dueDate, task.status);

    return {
      clientId: task.client?.id ?? null,
      clientName: task.client?.name ?? "No client",
      dealTitle: task.deal?.title ?? "No linked deal",
      dealValue: task.deal ? formatCurrency(Number(task.deal.value)) : "$0",
      description: task.description ?? "No notes added yet.",
      dueLabel: formatDueLabel(task.dueDate),
      dueState: dueState.label,
      dueStateColor: dueState.color,
      id: task.id,
      owner: task.assignee?.name ?? "Unassigned",
      priority: priorityLabels[task.priority],
      priorityColor: priorityStyles[task.priority],
      status: statusLabels[task.status],
      statusColor: statusStyles[task.status],
      title: task.title,
    };
  });

  const openTasks = tasks.filter((task) => task.status !== TaskStatus.DONE);
  const dueToday = openTasks.filter((task) => task.dueDate && task.dueDate >= todayStart && task.dueDate < tomorrowStart);
  const dueThisWeek = openTasks.filter((task) => task.dueDate && task.dueDate >= todayStart && task.dueDate <= weekEnd);
  const highPriorityTasks = openTasks.filter((task) => task.priority === TaskPriority.HIGH);
  const inProgressTasks = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS);
  const linkedDealValueById = new Map<string, number>();

  for (const task of openTasks) {
    if (task.deal) {
      linkedDealValueById.set(task.deal.id, Number(task.deal.value));
    }
  }

  const linkedRevenue = [...linkedDealValueById.values()].reduce((total, value) => total + value, 0);

  const statusGroups: TaskStatusGroup[] = statusOrder.map((status) => {
    const groupTasks = mappedTasks.filter((task) => task.status === statusLabels[status]);

    return {
      count: String(groupTasks.length),
      label: statusLabels[status],
      note: statusNotes[status],
      tasks: groupTasks,
      tone: statusTones[status],
    };
  });

  const priorityGroups: TaskPriorityGroup[] = priorityOrder.map((priority) => ({
    barColor: priorityBars[priority],
    count: String(tasks.filter((task) => task.priority === priority).length),
    label: priorityLabels[priority],
  }));

  return {
    metrics: [
      {
        label: "Open tasks",
        value: String(openTasks.length),
        change: String(inProgressTasks.length),
        note: "in progress",
        accent: "bg-blue-500",
        tint: "bg-blue-50 text-blue-700",
      },
      {
        label: "Due today",
        value: String(dueToday.length),
        change: String(dueThisWeek.length),
        note: "due this week",
        accent: "bg-amber-500",
        tint: "bg-amber-50 text-amber-700",
      },
      {
        label: "High priority",
        value: String(highPriorityTasks.length),
        change: highPriorityTasks[0]?.client?.name ?? "No blockers",
        note: "top account",
        accent: "bg-rose-500",
        tint: "bg-rose-50 text-rose-700",
      },
      {
        label: "Linked revenue",
        value: formatCompactCurrency(linkedRevenue),
        change: String(linkedDealValueById.size),
        note: "active deals",
        accent: "bg-emerald-500",
        tint: "bg-emerald-50 text-emerald-700",
      },
    ],
    priorityGroups,
    statusGroups,
    tasks: mappedTasks,
  };
}
