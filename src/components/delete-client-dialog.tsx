"use client";

import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useActionState, useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { deleteClientAction, type DeleteClientFormState } from "@/app/actions";

const initialState: DeleteClientFormState = {
  message: "",
  status: "idle",
};

type DeleteClientDialogProps = {
  clientId: string;
  clientName: string;
  dealCount: number;
  taskCount: number;
};

function DeleteClientForm({
  clientId,
  clientName,
  dealCount,
  onCancel,
  taskCount,
}: DeleteClientDialogProps & { onCancel: () => void }) {
  const [state, formAction, pending] = useActionState(deleteClientAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input name="clientId" type="hidden" value={clientId} />

      <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
        This removes {clientName}, its contacts, and {dealCount} linked deal{dealCount === 1 ? "" : "s"}.{" "}
        {taskCount} task{taskCount === 1 ? "" : "s"} will stay in the workspace without this client attached.
      </div>

      {state.message ? (
        <p aria-live="polite" className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
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
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 text-sm font-black text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? <Loader2 aria-hidden="true" className="animate-spin" size={17} strokeWidth={2.6} /> : null}
          <span>{pending ? "Deleting client" : "Delete client"}</span>
        </button>
      </div>
    </form>
  );
}

export function DeleteClientDialog({ clientId, clientName, dealCount, taskCount }: DeleteClientDialogProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const portalRoot = typeof document === "undefined" ? null : document.body;

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, []);

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

  const dialog = open ? (
    <div className="fixed inset-0 z-[100] overflow-y-auto px-4 py-6 sm:py-8">
      <button
        aria-label="Close delete client dialog"
        className="fixed inset-0 bg-[#07130e]/60 backdrop-blur-sm"
        onClick={closeDialog}
        type="button"
      />

      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 mx-auto w-full max-w-xl rounded-lg border border-[#f4c7c7] bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle aria-hidden="true" size={21} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#66756c]">Delete account</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#10231b]" id={titleId}>
                Remove {clientName}?
              </h2>
            </div>
          </div>
          <button
            aria-label="Close delete client dialog"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#d9e2dc] bg-white text-[#10231b] hover:bg-[#f4f7fb]"
            onClick={closeDialog}
            type="button"
          >
            <X aria-hidden="true" size={19} strokeWidth={2.5} />
          </button>
        </div>

        <DeleteClientForm
          clientId={clientId}
          clientName={clientName}
          dealCount={dealCount}
          onCancel={closeDialog}
          taskCount={taskCount}
        />
      </section>
    </div>
  ) : null;

  return (
    <>
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 shadow-sm hover:bg-rose-100"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Trash2 aria-hidden="true" size={16} strokeWidth={2.6} />
        <span>Delete account</span>
      </button>

      {portalRoot && dialog ? createPortal(dialog, portalRoot) : null}
    </>
  );
}
