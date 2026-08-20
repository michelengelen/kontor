"use client";

import { useActionState, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Input } from "@base-ui/react/input";
import { Select } from "@base-ui/react/select";
import { Checkmark, ChevronDown } from "@carbon/icons-react";
import {
  createCategory,
  saveEntry,
  type CreateCategoryState,
  type FormState,
} from "@/app/template/actions";
import { CADENCES } from "@/lib/cadence";
import { currentYm, formatMonthList, formatYmLong } from "@/lib/dates";
import { addMonths, occurrenceMonths, type Cadence } from "@/lib/occurrences";
import type { Category, PaymentSource, TemplateEntry } from "@/db/schema";
import { ChoiceChips } from "./chips";
import ui from "./ui.module.css";
import styles from "./dialog.module.css";

export function EntryDialog({
  trigger,
  triggerClass,
  open: controlledOpen,
  onOpenChange,
  categories,
  sources,
  entry,
}: {
  trigger?: React.ReactNode;
  triggerClass?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  categories: Category[];
  sources: PaymentSource[];
  entry?: TemplateEntry;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [session, setSession] = useState(0);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Remount the form on every open so fields and errors start fresh.
  function handleOpenChange(next: boolean) {
    if (next) setSession((s) => s + 1);
    setOpen(next);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <Dialog.Trigger className={triggerClass ?? ui.buttonPrimary}>
          {trigger}
        </Dialog.Trigger>
      ) : null}
      <Dialog.Portal>
        <Dialog.Backdrop className={ui.backdrop} />
        <Dialog.Popup className={ui.popup}>
          <p className={ui.dialogEyebrow}>Vorlage</p>
          <Dialog.Title className={ui.dialogTitle}>
            {entry ? "Eintrag bearbeiten" : "Neuer Eintrag"}
          </Dialog.Title>
          <EntryForm
            key={session}
            categories={categories}
            sources={sources}
            entry={entry}
            onSaved={() => setOpen(false)}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function monthOptions(selected: string): string[] {
  const start = addMonths(currentYm(), -24);
  const options: string[] = [];
  for (let i = 0; i < 38; i++) options.push(addMonths(start, i));
  if (!options.includes(selected)) options.unshift(selected);
  return options;
}

function EntryForm({
  categories,
  sources,
  entry,
  onSaved,
}: {
  categories: Category[];
  sources: PaymentSource[];
  entry?: TemplateEntry;
  onSaved: () => void;
}) {
  const defaultSource = sources.find((s) => s.isDefault);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await saveEntry(prev, formData);
      if (result && "ok" in result) onSaved();
      return result;
    },
    undefined,
  );
  const [cadence, setCadence] = useState<Cadence>(entry?.cadence ?? "monthly");
  const [startMonth, setStartMonth] = useState(
    entry?.startMonth ?? currentYm(),
  );
  const [categoryId, setCategoryId] = useState<number | null>(
    entry?.categoryId ?? null,
  );
  const [sourceId, setSourceId] = useState<number | null>(
    entry?.paymentSourceId ?? defaultSource?.id ?? null,
  );
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [catState, catAction, catPending] = useActionState<
    CreateCategoryState,
    FormData
  >(async (prev, formData) => {
    const result = await createCategory(prev, formData);
    if (result && "ok" in result) {
      setCategoryId(result.id);
      setCreatingCategory(false);
    }
    return result;
  }, undefined);

  const months = monthOptions(startMonth);

  return (
    <>
    <form action={action}>
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      <input type="hidden" name="cadence" value={cadence} />
      <input type="hidden" name="startMonth" value={startMonth} />
      <input type="hidden" name="categoryId" value={categoryId ?? ""} />
      <input type="hidden" name="paymentSourceId" value={sourceId ?? ""} />

      <div className={ui.field}>
        <label className={ui.label} htmlFor="entry-name">
          Name
        </label>
        <Input
          id="entry-name"
          name="name"
          required
          defaultValue={entry?.name}
          className={ui.input}
        />
      </div>

      <div className={styles.row}>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="entry-amount">
            Betrag
          </label>
          <div className={ui.amountWrap}>
            <Input
              id="entry-amount"
              name="amount"
              required
              inputMode="decimal"
              placeholder="42,50"
              defaultValue={
                entry
                  ? (entry.amountCents / 100).toFixed(2).replace(".", ",")
                  : ""
              }
              className={`${ui.input} ${ui.mono}`}
            />
            <span className={ui.amountSuffix}>€</span>
          </div>
        </div>

        <div className={ui.field}>
          <span className={ui.label}>Ab Monat</span>
          <Select.Root
            items={months.map((ym) => ({ value: ym, label: formatYmLong(ym) }))}
            value={startMonth}
            onValueChange={(v) => setStartMonth(v as string)}
          >
            <Select.Trigger className={ui.selectTriggerMono}>
              <Select.Value />
              <Select.Icon>
                <ChevronDown size={16} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner sideOffset={4}>
                <Select.Popup className={ui.selectPopup}>
                  <Select.List>
                    {months.map((ym) => (
                      <Select.Item
                        key={ym}
                        value={ym}
                        className={styles.monthItem}
                      >
                        <Select.ItemIndicator>
                          <Checkmark size={14} />
                        </Select.ItemIndicator>
                        <Select.ItemText>{formatYmLong(ym)}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <p className={ui.helper}>
            Erster Monat der Serie — taktet Quartal, Halbjahr &amp; Jährlich
          </p>
        </div>
      </div>

      <div className={ui.field}>
        <span className={ui.label}>Rhythmus</span>
        <ChoiceChips
          options={CADENCES.map((c) => ({ value: c.key, label: c.label }))}
          value={cadence}
          onChange={(v) => setCadence(v as Cadence)}
        />
        {cadence !== "monthly" ? (
          <p className={ui.helper}>
            Erscheint auf den Blättern im{" "}
            {formatMonthList(occurrenceMonths(cadence, startMonth))}
          </p>
        ) : null}
      </div>

      <div className={ui.field}>
        <span className={ui.label}>Kategorie</span>
        <ChoiceChips
          options={categories.map((c) => ({
            value: c.id,
            label: c.name,
            dotColor: c.color,
          }))}
          value={categoryId}
          onChange={(v) => setCategoryId(v as number | null)}
          allowNone
          trailing={
            categories.length < 12 ? (
              <button
                type="button"
                className={ui.chipBtnDashed}
                onClick={() => setCreatingCategory((c) => !c)}
              >
                + Neu
              </button>
            ) : null
          }
        />
        {creatingCategory ? (
          <div className={styles.inlineCreate}>
            <Input
              name="name"
              placeholder="Neue Kategorie…"
              aria-label="Name der neuen Kategorie"
              required
              className={ui.input}
              form="create-category"
            />
            <button
              type="submit"
              form="create-category"
              className={ui.button}
              disabled={catPending}
            >
              Anlegen
            </button>
          </div>
        ) : null}
        {catState && "error" in catState ? (
          <p className={ui.error}>{catState.error}</p>
        ) : null}
      </div>

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
          {pending ? "Speichern…" : "Speichern"}
        </button>
      </div>
    </form>
    {/* Sibling form for the inline category input — nested forms are
        invalid HTML, so the input points here via its form attribute. */}
    <form id="create-category" action={catAction} />
    </>
  );
}
