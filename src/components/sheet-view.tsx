"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Checkbox } from "@base-ui/react/checkbox";
import { Checkmark, ChevronDown, TrashCan } from "@carbon/icons-react";
import { deleteAdhocEntry, togglePaid } from "@/app/sheets/actions";
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

export function SheetView({
  rows,
  categoryOrder,
}: {
  rows: SheetRow[];
  categoryOrder: number[];
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

  const chartGroups = [...groups].sort((a, b) => b.sumCents - a.sumCents);

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
              Dieses Blatt ist leer. Füge einen One-off hinzu oder fülle
              zuerst die Vorlage.
            </p>
          ) : null}
        </div>

        {groups.length > 0 ? (
          <section className={`${styles.chartCard} ${styles.chartMobile}`}>
            <CategoryChart groups={chartGroups} total={total} />
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
            <CategoryChart groups={chartGroups} total={total} />
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

      {open && !settled ? (
        <div className={`${ui.meterTrack} ${styles.groupMeter}`}>
          <div
            className={ui.meterFill}
            style={{ width: `${(group.paidCents / group.sumCents) * 100}%` }}
          />
        </div>
      ) : null}

      <div className={open ? styles.groupBody : styles.groupBodyClosed}>
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
                <span className={ui.tag}>One-off</span>
              ) : null}
              {row.paymentSource ? (
                <span className={ui.tag}>{row.paymentSource}</span>
              ) : null}
              <span className={ui.leader} aria-hidden />
              <span className={`${ui.mono} ${styles.rowAmount}`}>
                {formatCents(row.amountCents)}
              </span>
              {row.source === "adhoc" ? (
                <ConfirmDialog
                  trigger={<TrashCan size={16} />}
                  title="One-off löschen?"
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
    </section>
  );
}

function CategoryChart({ groups, total }: { groups: Group[]; total: number }) {
  if (total === 0) return null;
  return (
    <div>
      <p className={ui.eyebrow}>Kategorien</p>
      <div
        className={styles.chartBar}
        role="img"
        aria-label="Ausgaben nach Kategorie"
      >
        {groups.map((g) => (
          <div
            key={g.key}
            className={styles.chartSegment}
            style={{
              width: `${(g.sumCents / total) * 100}%`,
              background: g.color ? colorVar(g.color) : "var(--cat-none)",
            }}
            title={`${g.name}: ${formatCents(g.sumCents)}`}
          />
        ))}
      </div>
      <ul className={styles.legend}>
        {groups.map((g) => (
          <li key={g.key} className={styles.legendRow}>
            <span
              className={ui.chipDot}
              style={{ background: g.color ? colorVar(g.color) : "var(--cat-none)" }}
            />
            <span className={styles.legendName}>{g.name}</span>
            <span className={ui.leader} aria-hidden />
            <span className={`${ui.mono} ${styles.legendValue}`}>
              {formatCents(g.sumCents)}
            </span>
            <span className={`${ui.mono} ${styles.legendPercent}`}>
              {percentFormatter.format(g.sumCents / total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
