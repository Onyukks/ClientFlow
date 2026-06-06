"use client";

import { ClipboardCheck, Loader2, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useId, useState } from "react";
import type { ReactNode } from "react";
import {
  createTaskAction,
  updateTaskAction,
  type TaskFormField,
  type TaskFormState,
} from "@/app/actions";
import type { TaskClientOption, TaskDealOption, TaskEditValues, TaskMemberOption } from "@/types/tasks";

const initialState: TaskFormState = {
  message: "",
  status: "idle",
};

const inputClassName =
  "mt-2 h-12 w-full rounded-lg border border-[#d9e2dc] bg-[#f8faf7] px-4 text-sm font-semibold text-[#10231b] outline-none transition focus:border-[#10231b]";

const textareaClassName =
  "mt-2 min-h-28 w-full rounded-lg border border-[#d9e2dc] bg-[#f8faf7] px-4 py-3 text-sm font-semibold text-[#10231b] outline-none transition focus:border-[#10231b]";

const labelClassName = "text-sm font-black text-[#10231b]";

const statusOptions = [
  { label: "To do", value: "TODO" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Done", value: "DONE" },
];

const priorityOptions = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
];

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm font-bold text-rose-700" id={id}>
      {message}
    </p>
  );
}

function TaskForm({
  clients,
  deals,
  initialValues,
  members,
  mode,
  onCancel,
  onSuccess,
}: {
  clients: TaskClientOption[];
  deals: TaskDealOption[];
  initialValues?: TaskEditValues;
  members: TaskMemberOption[];
  mode: "create" | "update";
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    mode === "create" ? createTaskAction : updateTaskAction,
    initialState,
  );
  const fieldId = useId();

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    const timeout = window.setTimeout(onSuccess, 500);

    return () => window.clearTimeout(timeout);
  }, [onSuccess, state.status]);

  const getErrorId = (field: TaskFormField) => `${fieldId}-${field}-error`;
  const getError = (field: TaskFormField) => state.fieldErrors?.[field];

  return (
    <form action={formAction} className="space-y-5">
      {initialValues ? <input name="taskId" type="hidden" value={initialValues.taskId} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClassName} htmlFor={`${fieldId}-task-title`}>
            Task title
          </label>
          <input
            aria-describedby={getError("title") ? getErrorId("title") : undefined}
            aria-invalid={Boolean(getError("title"))}
            className={inputClassName}
            defaultValue={initialValues?.title}
            id={`${fieldId}-task-title`}
            name="title"
            placeholder="Send revised proposal"
            required
          />
          <FieldError id={getErrorId("title")} message={getError("title")} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClassName} htmlFor={`${fieldId}-task-description`}>
            Notes
          </label>
          <textarea
            aria-describedby={getError("description") ? getErrorId("description") : undefined}
            aria-invalid={Boolean(getError("description"))}
            className={textareaClassName}
            defaultValue={initialValues?.description}
            id={`${fieldId}-task-description`}
            name="description"
            placeholder="Add context, next steps, or handoff notes."
          />
          <FieldError id={getErrorId("description")} message={getError("description")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor={`${fieldId}-task-client`}>
            Client
          </label>
          <select
            aria-describedby={getError("clientId") ? getErrorId("clientId") : undefined}
            aria-invalid={Boolean(getError("clientId"))}
            className={`${inputClassName} appearance-none`}
            defaultValue={initialValues?.clientId ?? ""}
            id={`${fieldId}-task-client`}
            name="clientId"
          >
            <option value="">No client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <FieldError id={getErrorId("clientId")} message={getError("clientId")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor={`${fieldId}-task-deal`}>
            Linked deal
          </label>
          <select
            aria-describedby={getError("dealId") ? getErrorId("dealId") : undefined}
            aria-invalid={Boolean(getError("dealId"))}
            className={`${inputClassName} appearance-none`}
            defaultValue={initialValues?.dealId ?? ""}
            id={`${fieldId}-task-deal`}
            name="dealId"
          >
            <option value="">No linked deal</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.title}
              </option>
            ))}
          </select>
          <FieldError id={getErrorId("dealId")} message={getError("dealId")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor={`${fieldId}-task-assignee`}>
            Assignee
          </label>
          <select
            aria-describedby={getError("assigneeId") ? getErrorId("assigneeId") : undefined}
            aria-invalid={Boolean(getError("assigneeId"))}
            className={`${inputClassName} appearance-none`}
            defaultValue={initialValues?.assigneeId ?? members[0]?.id ?? ""}
            id={`${fieldId}-task-assignee`}
            name="assigneeId"
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <FieldError id={getErrorId("assigneeId")} message={getError("assigneeId")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor={`${fieldId}-task-due`}>
            Due date
          </label>
          <input
            aria-describedby={getError("dueDate") ? getErrorId("dueDate") : undefined}
            aria-invalid={Boolean(getError("dueDate"))}
            className={inputClassName}
            defaultValue={initialValues?.dueDate}
            id={`${fieldId}-task-due`}
            name="dueDate"
            type="date"
          />
          <FieldError id={getErrorId("dueDate")} message={getError("dueDate")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor={`${fieldId}-task-status`}>
            Status
          </label>
          <select
            aria-describedby={getError("status") ? getErrorId("status") : undefined}
            aria-invalid={Boolean(getError("status"))}
            className={`${inputClassName} appearance-none`}
            defaultValue={initialValues?.status ?? "TODO"}
            id={`${fieldId}-task-status`}
            name="status"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <FieldError id={getErrorId("status")} message={getError("status")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor={`${fieldId}-task-priority`}>
            Priority
          </label>
          <select
            aria-describedby={getError("priority") ? getErrorId("priority") : undefined}
            aria-invalid={Boolean(getError("priority"))}
            className={`${inputClassName} appearance-none`}
            defaultValue={initialValues?.priority ?? "MEDIUM"}
            id={`${fieldId}-task-priority`}
            name="priority"
          >
            {priorityOptions.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
          <FieldError id={getErrorId("priority")} message={getError("priority")} />
        </div>
      </div>

      {state.message ? (
        <p
          aria-live="polite"
          className={`rounded-lg px-4 py-3 text-sm font-black ${
            state.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-[#edf0ee] pt-5 sm:flex-row sm:justify-end">
        <button
          className="h-12 rounded-lg border border-[#d9e2dc] bg-white px-5 text-sm font-black text-[#10231b] hover:bg-[#f4f7fb]"
          disabled={pending}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#10231b] px-5 text-sm font-black text-white shadow-sm hover:bg-[#1f3a2f] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? <Loader2 aria-hidden="true" className="animate-spin" size={17} strokeWidth={2.6} /> : null}
          <span>
            {pending
              ? mode === "create"
                ? "Adding task"
                : "Saving changes"
              : mode === "create"
                ? "Add task"
                : "Save changes"}
          </span>
        </button>
      </div>
    </form>
  );
}

function TaskDialogFrame({
  children,
  eyebrow,
  onClose,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  onClose: () => void;
  title: string;
}) {
  const titleId = useId();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-5">
      <button
        aria-label={`Close ${title} dialog`}
        className="absolute inset-0 bg-[#07130e]/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#10231b] text-white">
              <ClipboardCheck aria-hidden="true" size={20} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#66756c]">{eyebrow}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#10231b]" id={titleId}>
                {title}
              </h2>
            </div>
          </div>
          <button
            aria-label={`Close ${title} dialog`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#d9e2dc] bg-white text-[#10231b] hover:bg-[#f4f7fb]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={19} strokeWidth={2.5} />
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}

export function AddTaskDialog({
  clients,
  deals,
  members,
}: {
  clients: TaskClientOption[];
  deals: TaskDealOption[];
  members: TaskMemberOption[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSuccess = useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#10231b] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#1f3a2f]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Plus aria-hidden="true" size={17} strokeWidth={2.6} />
        <span>Add task</span>
      </button>

      {open ? (
        <TaskDialogFrame eyebrow="New follow-up" onClose={closeDialog} title="Add task">
          <TaskForm
            clients={clients}
            deals={deals}
            members={members}
            mode="create"
            onCancel={closeDialog}
            onSuccess={handleSuccess}
          />
        </TaskDialogFrame>
      ) : null}
    </>
  );
}

export function EditTaskDialog({
  clients,
  deals,
  initialValues,
  members,
}: {
  clients: TaskClientOption[];
  deals: TaskDealOption[];
  initialValues: TaskEditValues;
  members: TaskMemberOption[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSuccess = useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d9e2dc] bg-white px-3 py-2 text-xs font-black text-[#10231b] shadow-sm hover:bg-[#f4f7fb]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Pencil aria-hidden="true" size={14} strokeWidth={2.6} />
        <span>Edit</span>
      </button>

      {open ? (
        <TaskDialogFrame eyebrow="Work item" onClose={closeDialog} title="Edit task">
          <TaskForm
            clients={clients}
            deals={deals}
            initialValues={initialValues}
            members={members}
            mode="update"
            onCancel={closeDialog}
            onSuccess={handleSuccess}
          />
        </TaskDialogFrame>
      ) : null}
    </>
  );
}
