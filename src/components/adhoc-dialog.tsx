"use client";

import { useActionState, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Input } from "@base-ui/react/input";
import { Add } from "@carbon/icons-react";
import { addAdhocEntry } from "@/app/sheets/actions";
import type { FormState } from "@/app/template/actions";
import type { Category, PaymentSource } from "@/db/schema";
import { ChoiceChips } from "./chips";
import ui from "./ui.module.css";
import styles from "./dialog.module.css";

// Add a one-off expense line to an existing sheet.
export function AdhocDialog({
  sheetId,
  monthTitle,
  categories,
  sources,
}: {
  sheetId: number;
  monthTitle: string;
  categories: Category[];
  sources: PaymentSource[];
}) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  function handleOpenChange(next: boolean) {
    if (next) setSession((s) => s + 1);
    setOpen(next);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger className={ui.button}>
        <Add size={16} /> One-off
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={ui.backdrop} />
        <Dialog.Popup className={ui.popup}>
          <p className={ui.dialogEyebrow}>Monatsblatt · {monthTitle}</p>
          <Dialog.Title className={ui.dialogTitle}>
            One-off hinzufügen
          </Dialog.Title>
          <Dialog.Description className={ui.dialogSubtitle}>
            Gilt nur für dieses Blatt
          </Dialog.Description>
          <AdhocForm
            key={session}
            sheetId={sheetId}
            categories={categories}
            sources={sources}
            onSaved={() => setOpen(false)}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AdhocForm({
  sheetId,
  categories,
  sources,
  onSaved,
}: {
  sheetId: number;
  categories: Category[];
  sources: PaymentSource[];
  onSaved: () => void;
}) {
  const defaultSource = sources.find((s) => s.isDefault);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await addAdhocEntry(prev, formData);
      if (result && "ok" in result) onSaved();
      return result;
    },
    undefined,
  );
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [sourceId, setSourceId] = useState<number | null>(
    defaultSource?.id ?? null,
  );

  return (
    <form action={action}>
      <input type="hidden" name="sheetId" value={sheetId} />
      <input type="hidden" name="categoryId" value={categoryId ?? ""} />
      <input type="hidden" name="paymentSourceId" value={sourceId ?? ""} />

      <div className={ui.field}>
        <label className={ui.label} htmlFor="adhoc-name">
          Name
        </label>
        <Input
          id="adhoc-name"
          name="name"
          autoComplete="off"
          data-1p-ignore
          required
          className={ui.input}
        />
      </div>

      <div className={ui.field}>
        <label className={ui.label} htmlFor="adhoc-amount">
          Betrag
        </label>
        <div className={ui.amountWrap}>
          <Input
            id="adhoc-amount"
            name="amount"
            autoComplete="off"
            required
            inputMode="decimal"
            placeholder="42,50"
            className={`${ui.input} ${ui.mono}`}
          />
          <span className={ui.amountSuffix}>€</span>
        </div>
      </div>

      {categories.length > 0 ? (
        <div className={ui.field}>
          <span className={ui.label}>
            Kategorie <span className={styles.optional}>— optional</span>
          </span>
          <ChoiceChips
            options={categories.map((c) => ({
              value: c.id,
              label: c.name,
              dotColor: c.color,
            }))}
            value={categoryId}
            onChange={(v) => setCategoryId(v as number | null)}
            allowNone
          />
        </div>
      ) : null}

      <div className={ui.field}>
        <span className={ui.label}>Bezahlt von</span>
        <ChoiceChips
          options={sources.map((s) => ({ value: s.id, label: s.name }))}
          value={sourceId}
          onChange={(v) => setSourceId(v as number | null)}
        />
      </div>

      {state && "error" in state ? (
        <p className={ui.error}>{state.error}</p>
      ) : null}

      <div className={ui.dialogActions}>
        <Dialog.Close className={ui.button}>Abbrechen</Dialog.Close>
        <button type="submit" className={ui.buttonPrimary} disabled={pending}>
          {pending ? "Hinzufügen…" : "Hinzufügen"}
        </button>
      </div>
    </form>
  );
}
