"use client";

import { useActionState, useOptimistic, useState, useTransition } from "react";
import { Checkbox } from "@base-ui/react/checkbox";
import { Dialog } from "@base-ui/react/dialog";
import { Input } from "@base-ui/react/input";
import { Checkmark, ChevronDown, TrashCan } from "@carbon/icons-react";
import { deleteAdhocEntry, togglePaid, updateEntryAmount } from "@/app/sheets/actions";
import type { FormState } from "@/app/template/actions";
import { colorVar } from "@/lib/colors";
import { formatCents } from "@/lib/money";
import { ConfirmDialog } from "./confirm-dialog";
import ui from "./ui.module.css";
import styles from "./sheet-view.module.css";

export type SheetRow = {
  id: number;
  name: string;
  amountCents: number;
  source: "template" | "adhoc";
  paid: boolean;
  paymentSource: string | null;
  category: { id: number; name: string; color: string } | null;
};

type Group = {
  key: number;
  name: string;
  color: string | null;
  rows: SheetRow[];
  sumCents: number;
  paidCents: number;
};

const percentFormatter = new Intl.NumberFormat("de-DE", {
  style: "percent",
  maximumFractionDigits: 0,
});

type Segment = { key: string; name: string; color: string; value: number };

export function SheetView({
  rows,
  categoryOrder,
  defaultSource,
}: {
  rows: SheetRow[];
  categoryOrder: number[];
  defaultSource: string;
}) {
  const [optimisticRows, applyToggle] = useOptimistic(
    rows,
    (state, update: { id: number; paid: boolean }) =>
      state.map((r) => (r.id === update.id ? { ...r, paid: update.paid } : r)),
  );
  const [, startTransition] = useTransition();

  function toggle(id: number, paid: boolean) {
    startTransition(async () => {
      applyToggle({ id, paid });
      await togglePaid(id, paid);
    });
  }

  const total = optimisticRows.reduce((sum, r) => sum + r.amountCents, 0);
  const paid = optimisticRows
    .filter((r) => r.paid)
    .reduce((sum, r) => sum + r.amountCents, 0);
  const fraction = total > 0 ? paid / total : 0;

  const groups: Group[] = [];
  for (const key of [...categoryOrder, 0]) {
    const groupRows = optimisticRows
      .filter((r) => (r.category?.id ?? 0) === key)
      .sort((a, b) => b.amountCents - a.amountCents || a.name.localeCompare(b.name));
    if (groupRows.length === 0) continue;
    const category = groupRows[0].category;
    groups.push({
      key,
      name: category?.name ?? "Ohne Kategorie",
      color: category?.color ?? null,
      rows: groupRows,
      sumCents: groupRows.reduce((s, r) => s + r.amountCents, 0),
      paidCents: groupRows
        .filter((r) => r.paid)
        .reduce((s, r) => s + r.amountCents, 0),
    });
  }

  const categorySegments: Segment[] = [...groups]
    .sort((a, b) => b.sumCents - a.sumCents)
    .map((g) => ({
      key: String(g.key),
      name: g.name,
      color: g.color ? colorVar(g.color) : "var(--cat-none)",
      value: g.sumCents,
    }));

  const bySource = new Map<string, number>();
  for (const row of optimisticRows) {
    const name = row.paymentSource ?? defaultSource;
    bySource.set(name, (bySource.get(name) ?? 0) + row.amountCents);
  }
  const sourceSegments: Segment[] = [...bySource.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      key: name,
      name,
      color: index < 4 ? `var(--src-${index + 1})` : "var(--cat-none)",
      value,
    }));

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <div className={styles.topMeter}>
          <div className={ui.meterTrack}>
            <div
              className={ui.meterFill}
              style={{ width: `${fraction * 100}%` }}
            />
          </div>
          <p className={`${ui.mono} ${styles.topMeterLine}`}>
            {formatCents(total - paid)} offen von {formatCents(total)} ·{" "}
            {percentFormatter.format(fraction)}
          </p>
        </div>

        <div className={styles.groups}>
          {groups.map((group) => (
            <CategoryGroup key={group.key} group={group} onToggle={toggle} />
          ))}
          {groups.length === 0 ? (
            <p className={styles.empty}>
              Dieses Blatt ist leer. Füge einen einmaligen Eintrag hinzu oder fülle
              zuerst die Vorlage.
            </p>
          ) : null}
        </div>

        {groups.length > 0 ? (
          <section className={`${styles.chartCard} ${styles.chartMobile}`}>
            <SegmentChart
              title="Kategorien"
              segments={categorySegments}
              total={total}
            />
          </section>
        ) : null}
        {sourceSegments.length > 1 ? (
          <section className={`${styles.chartCard} ${styles.chartMobile}`}>
            <SegmentChart
              title="Bezahlt von"
              segments={sourceSegments}
              total={total}
            />
          </section>
        ) : null}
      </div>

      <aside className={styles.aside}>
        <section className={styles.summaryCard}>
          <p className={ui.eyebrow}>Offen</p>
          <p className={`${ui.mono} ${styles.summaryValue}`}>
            {formatCents(total - paid)}
          </p>
          <div className={ui.meterTrack}>
            <div
              className={ui.meterFill}
              style={{ width: `${fraction * 100}%` }}
            />
          </div>
          <dl className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <dt>Total</dt>
              <dd className={ui.mono}>{formatCents(total)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Bezahlt</dt>
              <dd className={`${ui.mono} ${styles.good}`}>
                {formatCents(paid)}
              </dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Fortschritt</dt>
              <dd className={ui.mono}>{percentFormatter.format(fraction)}</dd>
            </div>
          </dl>
        </section>

        {groups.length > 0 ? (
          <section className={styles.chartCard}>
            <SegmentChart
              title="Kategorien"
              segments={categorySegments}
              total={total}
            />
          </section>
        ) : null}
        {sourceSegments.length > 1 ? (
          <section className={styles.chartCard}>
            <SegmentChart
              title="Bezahlt von"
              segments={sourceSegments}
              total={total}
            />
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function CategoryGroup({
  group,
  onToggle,
}: {
  group: Group;
  onToggle: (id: number, paid: boolean) => void;
}) {
  const settled = group.rows.every((r) => r.paid);
  const paidCount = group.rows.filter((r) => r.paid).length;
  const [override, setOverride] = useState<boolean | null>(null);
  // Auto-collapse when the group settles; a click can still reopen it.
  const open = override ?? !settled;

  return (
    <section className={styles.group}>
      <button
        type="button"
        className={styles.groupHeader}
        aria-expanded={open}
        onClick={() => setOverride(!open)}
      >
        <ChevronDown
          size={16}
          className={open ? ui.chevron : ui.chevronClosed}
        />
        <span
          className={ui.chipDot}
          style={{ background: group.color ? colorVar(group.color) : "var(--cat-none)" }}
        />
        <span className={styles.groupName}>{group.name}</span>
        {settled ? (
          <Checkmark size={16} className={styles.good} aria-label="abgeschlossen" />
        ) : (
          <span className={ui.metaMono}>
            {paidCount}/{group.rows.length}
          </span>
        )}
        <span className={ui.leader} aria-hidden />
        <span
          className={`${ui.mono} ${settled ? styles.groupSumSettled : styles.groupSum}`}
        >
          {formatCents(group.sumCents)}
        </span>
      </button>

      <div className={open ? styles.groupBody : styles.groupBodyClosed}>
        <div className={styles.groupBodyInner}>
        <div className={`${ui.meterTrack} ${styles.groupMeter}`}>
          <div
            className={ui.meterFill}
            style={{
              width: `${
                group.sumCents > 0
                  ? (group.paidCents / group.sumCents) * 100
                  : 0
              }%`,
            }}
          />
        </div>
        <ul className={styles.rows}>
          {group.rows.map((row) => (
            <li
              key={row.id}
              className={`${styles.row} ${row.paid ? styles.rowPaid : ""}`}
            >
              <Checkbox.Root
                checked={row.paid}
                onCheckedChange={(checked) => onToggle(row.id, checked === true)}
                className={styles.check}
                aria-label={`${row.name}, ${formatCents(row.amountCents)}`}
              >
                <Checkbox.Indicator>
                  <Checkmark size={16} />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <span className={styles.rowName}>{row.name}</span>
              {row.source === "adhoc" ? (
                <span className={ui.tag}>einmalig</span>
              ) : null}
              {row.paymentSource ? (
                <span className={ui.tag}>{row.paymentSource}</span>
              ) : null}
              <span className={ui.leader} aria-hidden />
              <EditAmountDialog row={row} />
              {row.source === "adhoc" ? (
                <ConfirmDialog
                  trigger={<TrashCan size={16} />}
                  title="Einmaligen Eintrag löschen?"
                  body={
                    <>
                      „{row.name}“ (
                      <span className={ui.mono}>
                        {formatCents(row.amountCents)}
                      </span>
                      ) wird von diesem Blatt entfernt. Das lässt sich nicht
                      rückgängig machen.
                    </>
                  }
                  confirmLabel="Löschen"
                  action={deleteAdhocEntry.bind(null, row.id)}
                />
              ) : null}
            </li>
          ))}
        </ul>
        </div>
      </div>
    </section>
  );
}

// Stacked bar + legend for one part-to-whole dimension.
function SegmentChart({
  title,
  segments,
  total,
}: {
  title: string;
  segments: Segment[];
  total: number;
}) {
  if (total === 0) return null;
  return (
    <div>
      <p className={ui.eyebrow}>{title}</p>
      <div
        className={styles.chartBar}
        role="img"
        aria-label={`Ausgaben nach ${title}`}
      >
        {segments.map((s) => (
          <div
            key={s.key}
            className={styles.chartSegment}
            style={{
              width: `${(s.value / total) * 100}%`,
              background: s.color,
            }}
            title={`${s.name}: ${formatCents(s.value)}`}
          />
        ))}
      </div>
      <ul className={styles.legend}>
        {segments.map((s) => (
          <li key={s.key} className={styles.legendRow}>
            <span className={ui.chipDot} style={{ background: s.color }} />
            <span className={styles.legendName}>{s.name}</span>
            <span className={ui.leader} aria-hidden />
            <span className={`${ui.mono} ${styles.legendValue}`}>
              {formatCents(s.value)}
            </span>
            <span className={`${ui.mono} ${styles.legendPercent}`}>
              {percentFormatter.format(s.value / total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Betrag-only editor for a frozen sheet row. Name, cadence, and
// category are deliberately not editable here.
function EditAmountDialog({ row }: { row: SheetRow }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  function handleOpenChange(next: boolean) {
    if (next) setSession((s) => s + 1);
    setOpen(next);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger
        className={`${ui.mono} ${styles.rowAmount} ${styles.amountTrigger}`}
        aria-label={`Betrag ändern für ${row.name}`}
      >
        {formatCents(row.amountCents)}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={ui.backdrop} />
        <Dialog.Popup className={ui.popupCenter}>
          <Dialog.Title className={ui.dialogTitle}>Betrag ändern</Dialog.Title>
          <Dialog.Description className={ui.dialogSubtitle}>
            „{row.name}“ — nur der Betrag lässt sich anpassen
          </Dialog.Description>
          <AmountForm key={session} row={row} onSaved={() => setOpen(false)} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AmountForm({ row, onSaved }: { row: SheetRow; onSaved: () => void }) {
  const [amount, setAmount] = useState(
    (row.amountCents / 100).toFixed(2).replace(".", ","),
  );
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await updateEntryAmount(prev, formData);
      if (result && "ok" in result) onSaved();
      return result;
    },
    undefined,
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={row.id} />
      <div className={ui.field}>
        <label className={ui.label} htmlFor={`amount-${row.id}`}>
          Betrag
        </label>
        <div className={ui.amountWrap}>
          <Input
            id={`amount-${row.id}`}
            name="amount"
            autoComplete="off"
            required
            autoFocus
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${ui.input} ${ui.mono}`}
          />
          <span className={ui.amountSuffix}>€</span>
        </div>
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
  );
}
