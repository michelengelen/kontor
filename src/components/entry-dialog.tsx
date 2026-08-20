"use client";

import { useActionState, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Input } from "@base-ui/react/input";
import { Select } from "@base-ui/react/select";
import { Add, Checkmark, ChevronDown } from "@carbon/icons-react";
import {
  createCategory,
  saveEntry,
  type CreateCategoryState,
  type FormState,
} from "@/app/template/actions";
import { CADENCES } from "@/lib/cadence";
import { currentYm, formatMonthList, monthName, parseYm } from "@/lib/dates";
import { occurrenceMonths, ymFrom, type Cadence } from "@/lib/occurrences";
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

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

// The year is irrelevant for phasing (modulo 12); store the most
// recent year in which the picked month is not in the future, so
// entries always appear on current sheets.
function toStoredYm(month: number): string {
  const { year, month: cur } = parseYm(currentYm());
  return ymFrom(month <= cur ? year : year - 1, month);
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
  const [name, setName] = useState(entry?.name ?? "");
  const [amount, setAmount] = useState(
    entry ? (entry.amountCents / 100).toFixed(2).replace(".", ",") : "",
  );
  const [cadence, setCadence] = useState<Cadence>(entry?.cadence ?? "monthly");
  const [startMonthNum, setStartMonthNum] = useState(
    parseYm(entry?.startMonth ?? currentYm()).month,
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

  const monthly = cadence === "monthly";
  const currentMonth = parseYm(currentYm()).month;
  const startMonth = toStoredYm(monthly ? currentMonth : startMonthNum);

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
          autoComplete="off"
          data-1p-ignore
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
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
              autoComplete="off"
              required
              inputMode="decimal"
              placeholder="42,50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${ui.input} ${ui.mono}`}
            />
            <span className={ui.amountSuffix}>€</span>
          </div>
        </div>

        <div className={ui.field}>
          <span className={ui.label}>Startmonat</span>
          <Select.Root
            items={MONTHS.map((m) => ({ value: m, label: monthName(m) }))}
            value={monthly ? currentMonth : startMonthNum}
            onValueChange={(v) => setStartMonthNum(v as number)}
            disabled={monthly}
          >
            <Select.Trigger className={ui.selectTrigger}>
              <Select.Value />
              <Select.Icon>
                <ChevronDown size={16} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner sideOffset={4}>
                <Select.Popup className={ui.selectPopup}>
                  <Select.List>
                    {MONTHS.map((m) => (
                      <Select.Item
                        key={m}
                        value={m}
                        className={ui.selectItem}
                      >
                        <Select.ItemIndicator>
                          <Checkmark size={14} />
                        </Select.ItemIndicator>
                        <Select.ItemText>{monthName(m)}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>

      <div className={ui.field}>
        <span className={ui.label}>Rhythmus</span>
        <ChoiceChips
          options={CADENCES.map((c) => ({ value: c.key, label: c.label }))}
          value={cadence}
          onChange={(v) => setCadence(v as Cadence)}
        />
        <p className={ui.helper}>
          {monthly
            ? "Erscheint auf jedem Monatsblatt"
            : `Erscheint auf den Blättern im ${formatMonthList(
                occurrenceMonths(cadence, startMonth),
              )}`}
        </p>
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
                <Add size={14} /> Neu
              </button>
            ) : null
          }
        />
        {creatingCategory ? (
          <div className={styles.inlineCreate}>
            <Input
              name="name"
              autoComplete="off"
              data-1p-ignore
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
