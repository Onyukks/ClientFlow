"use client";

import { DollarSign, Loader2, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useId, useState } from "react";
import type { ReactNode } from "react";
import {
  createDealAction,
  updateDealAction,
  type DealFormField,
  type DealFormState,
} from "@/app/actions";
import type { DealClientOption, DealEditValues } from "@/types/deals";

const initialState: DealFormState = {
  message: "",
  status: "idle",
};

const inputClassName =
  "mt-2 h-12 w-full rounded-lg border border-[#d9e2dc] bg-[#f8faf7] px-4 text-sm font-semibold text-[#10231b] outline-none transition focus:border-[#10231b]";

const labelClassName = "text-sm font-black text-[#10231b]";

const stageOptions = [
  { label: "Qualified", value: "QUALIFIED" },
  { label: "Discovery", value: "DISCOVERY" },
  { label: "Proposal", value: "PROPOSAL" },
  { label: "Negotiation", value: "NEGOTIATION" },
  { label: "Won", value: "WON" },
  { label: "Lost", value: "LOST" },
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

function DealForm({
  clients,
  initialValues,
  mode,
  onCancel,
  onSuccess,
}: {
  clients: DealClientOption[];
  initialValues?: DealEditValues;
  mode: "create" | "update";
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    mode === "create" ? createDealAction : updateDealAction,
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

  const getErrorId = (field: DealFormField) => `${fieldId}-${field}-error`;
  const getError = (field: DealFormField) => state.fieldErrors?.[field];

  return (
    <form action={formAction} className="space-y-5">
      {initialValues ? <input name="dealId" type="hidden" value={initialValues.dealId} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClassName} htmlFor={`${fieldId}-deal-title`}>
            Deal title
          </label>
          <input
            aria-describedby={getError("title") ? getErrorId("title") : undefined}
            aria-invalid={Boolean(getError("title"))}
            className={inputClassName}
            defaultValue={initialValues?.title}
            id={`${fieldId}-deal-title`}
            name="title"
            placeholder="Northstar expansion rollout"
            required
          />
          <FieldError id={getErrorId("title")} message={getError("title")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor={`${fieldId}-deal-client`}>
            Client
          </label>
          <select
            aria-describedby={getError("clientId") ? getErrorId("clientId") : undefined}
            aria-invalid={Boolean(getError("clientId"))}
            className={`${inputClassName} appearance-none`}
            defaultValue={initialValues?.clientId ?? clients[0]?.id ?? ""}
            id={`${fieldId}-deal-client`}
            name="clientId"
            required
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <FieldError id={getErrorId("clientId")} message={getError("clientId")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor={`${fieldId}-deal-stage`}>
            Stage
          </label>
          <select
            aria-describedby={getError("stage") ? getErrorId("stage") : undefined}
            aria-invalid={Boolean(getError("stage"))}
            className={`${inputClassName} appearance-none`}
            defaultValue={initialValues?.stage ?? "QUALIFIED"}
            id={`${fieldId}-deal-stage`}
            name="stage"
          >
            {stageOptions.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
          <FieldError id={getErrorId("stage")} message={getError("stage")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor={`${fieldId}-deal-value`}>
            Deal value
          </label>
          <input
            aria-describedby={getError("value") ? getErrorId("value") : undefined}
            aria-invalid={Boolean(getError("value"))}
            className={inputClassName}
            defaultValue={initialValues?.value}
            id={`${fieldId}-deal-value`}
            min="0"
            name="value"
            placeholder="25000"
            required
            step="100"
            type="number"
          />
          <FieldError id={getErrorId("value")} message={getError("value")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor={`${fieldId}-deal-probability`}>
            Probability
          </label>
          <input
            aria-describedby={getError("probability") ? getErrorId("probability") : undefined}
            aria-invalid={Boolean(getError("probability"))}
            className={inputClassName}
            defaultValue={initialValues?.probability ?? "50"}
            id={`${fieldId}-deal-probability`}
            max="100"
            min="0"
            name="probability"
            required
            step="1"
            type="number"
          />
          <FieldError id={getErrorId("probability")} message={getError("probability")} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClassName} htmlFor={`${fieldId}-deal-close`}>
            Expected close date
          </label>
          <input
            aria-describedby={getError("expectedCloseDate") ? getErrorId("expectedCloseDate") : undefined}
            aria-invalid={Boolean(getError("expectedCloseDate"))}
            className={inputClassName}
            defaultValue={initialValues?.expectedCloseDate}
            id={`${fieldId}-deal-close`}
            name="expectedCloseDate"
            type="date"
          />
          <FieldError id={getErrorId("expectedCloseDate")} message={getError("expectedCloseDate")} />
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
                ? "Adding deal"
                : "Saving changes"
              : mode === "create"
                ? "Add deal"
                : "Save changes"}
          </span>
        </button>
      </div>
    </form>
  );
}

function DealDialogFrame({
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
    <div className="fixed inset-0 z-[60] overflow-y-auto px-4 py-6 sm:py-8">
      <button
        aria-label={`Close ${title} dialog`}
        className="fixed inset-0 bg-[#07130e]/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 mx-auto w-full max-w-3xl rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#10231b] text-white">
              <DollarSign aria-hidden="true" size={20} strokeWidth={2.5} />
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

export function AddDealDialog({ clients }: { clients: DealClientOption[] }) {
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
        <span>Add deal</span>
      </button>

      {open ? (
        <DealDialogFrame eyebrow="New opportunity" onClose={closeDialog} title="Add deal">
          <DealForm clients={clients} mode="create" onCancel={closeDialog} onSuccess={handleSuccess} />
        </DealDialogFrame>
      ) : null}
    </>
  );
}

export function EditDealDialog({
  clients,
  initialValues,
}: {
  clients: DealClientOption[];
  initialValues: DealEditValues;
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
        <DealDialogFrame eyebrow="Pipeline detail" onClose={closeDialog} title="Edit deal">
          <DealForm
            clients={clients}
            initialValues={initialValues}
            mode="update"
            onCancel={closeDialog}
            onSuccess={handleSuccess}
          />
        </DealDialogFrame>
      ) : null}
    </>
  );
}
