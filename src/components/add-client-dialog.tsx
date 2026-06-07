"use client";

import { Building2, Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useId, useState } from "react";
import { createClientAction, type CreateClientField, type CreateClientFormState } from "@/app/actions";

const initialState: CreateClientFormState = {
  message: "",
  status: "idle",
};

const inputClassName =
  "mt-2 h-12 w-full rounded-lg border border-[#d9e2dc] bg-[#f8faf7] px-4 text-sm font-semibold text-[#10231b] outline-none transition focus:border-[#10231b]";

const labelClassName = "text-sm font-black text-[#10231b]";

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

function AddClientForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState(createClientAction, initialState);
  const fieldId = useId();

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    const timeout = window.setTimeout(onSuccess, 500);

    return () => window.clearTimeout(timeout);
  }, [onSuccess, state.status]);

  const getErrorId = (field: CreateClientField) => `${fieldId}-${field}-error`;
  const getError = (field: CreateClientField) => state.fieldErrors?.[field];

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClassName} htmlFor="client-name">
            Company name
          </label>
          <input
            aria-describedby={getError("name") ? getErrorId("name") : undefined}
            aria-invalid={Boolean(getError("name"))}
            className={inputClassName}
            id="client-name"
            name="name"
            required
          />
          <FieldError id={getErrorId("name")} message={getError("name")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor="client-industry">
            Industry
          </label>
          <input className={inputClassName} id="client-industry" name="industry" />
        </div>

        <div>
          <label className={labelClassName} htmlFor="client-status">
            Status
          </label>
          <select
            className={`${inputClassName} appearance-none`}
            defaultValue="PROSPECT"
            id="client-status"
            name="status"
          >
            <option value="PROSPECT">Prospect</option>
            <option value="ACTIVE">Active</option>
            <option value="AT_RISK">At risk</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div>
          <label className={labelClassName} htmlFor="client-value">
            Estimated value
          </label>
          <input
            aria-describedby={getError("estimatedValue") ? getErrorId("estimatedValue") : undefined}
            aria-invalid={Boolean(getError("estimatedValue"))}
            className={inputClassName}
            id="client-value"
            min="0"
            name="estimatedValue"
            placeholder="0"
            step="100"
            type="number"
          />
          <FieldError id={getErrorId("estimatedValue")} message={getError("estimatedValue")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor="client-website">
            Website
          </label>
          <input
            aria-describedby={getError("website") ? getErrorId("website") : undefined}
            aria-invalid={Boolean(getError("website"))}
            className={inputClassName}
            id="client-website"
            name="website"
            placeholder="example.com"
          />
          <FieldError id={getErrorId("website")} message={getError("website")} />
        </div>
      </div>

      <div className="h-px bg-[#edf0ee]" />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName} htmlFor="contact-name">
            Primary contact
          </label>
          <input
            aria-describedby={getError("contactName") ? getErrorId("contactName") : undefined}
            aria-invalid={Boolean(getError("contactName"))}
            className={inputClassName}
            id="contact-name"
            name="contactName"
            required
          />
          <FieldError id={getErrorId("contactName")} message={getError("contactName")} />
        </div>

        <div>
          <label className={labelClassName} htmlFor="contact-email">
            Contact email
          </label>
          <input
            aria-describedby={getError("contactEmail") ? getErrorId("contactEmail") : undefined}
            aria-invalid={Boolean(getError("contactEmail"))}
            className={inputClassName}
            id="contact-email"
            name="contactEmail"
            type="email"
          />
          <FieldError id={getErrorId("contactEmail")} message={getError("contactEmail")} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClassName} htmlFor="contact-title">
            Contact title
          </label>
          <input className={inputClassName} id="contact-title" name="contactTitle" />
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
          <span>{pending ? "Adding client" : "Add client"}</span>
        </button>
      </div>
    </form>
  );
}

export function AddClientDialog({ label = "Add client" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const titleId = useId();

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
        <span>{label}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] overflow-y-auto px-4 py-6 sm:py-8">
          <button
            aria-label="Close add client dialog"
            className="fixed inset-0 bg-[#07130e]/60 backdrop-blur-sm"
            onClick={closeDialog}
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
                  <Building2 aria-hidden="true" size={20} strokeWidth={2.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#66756c]">New account</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#10231b]" id={titleId}>
                    Add client
                  </h2>
                </div>
              </div>
              <button
                aria-label="Close add client dialog"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#d9e2dc] bg-white text-[#10231b] hover:bg-[#f4f7fb]"
                onClick={closeDialog}
                type="button"
              >
                <X aria-hidden="true" size={19} strokeWidth={2.5} />
              </button>
            </div>

            <AddClientForm onCancel={closeDialog} onSuccess={handleSuccess} />
          </section>
        </div>
      ) : null}
    </>
  );
}
