"use client";

import { useActionState, useState } from "react";
import { Select } from "@base-ui/react/select";
import { Checkmark, ChevronDown } from "@carbon/icons-react";
import { createSheet } from "./actions";
import type { FormState } from "@/app/template/actions";
import ui from "@/components/ui.module.css";
import styles from "./sheets.module.css";

export type MonthOption = { ym: string; label: string; exists: boolean };

export function CreateSheetForm({ options }: { options: MonthOption[] }) {
  const firstFree = options.find((o) => !o.exists);
  const [month, setMonth] = useState<string | null>(firstFree?.ym ?? null);
  const [state, action, pending] = useActionState<FormState, FormData>(
    createSheet,
    undefined,
  );

  return (
    <div>
      <form action={action} className={styles.createForm}>
        <input type="hidden" name="month" value={month ?? ""} />
        <Select.Root
          items={options.map((o) => ({ value: o.ym, label: o.label }))}
          value={month}
          onValueChange={(v) => setMonth(v as string)}
        >
          <Select.Trigger
            className={`${ui.selectTriggerMono} ${styles.monthTrigger}`}
            aria-label="Monat"
            disabled={!firstFree}
          >
            <Select.Value>{month ? undefined : "—"}</Select.Value>
            <Select.Icon>
              <ChevronDown size={16} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner sideOffset={4}>
              <Select.Popup className={ui.selectPopup}>
                <Select.List>
                  {options.map((o) => (
                    <Select.Item
                      key={o.ym}
                      value={o.ym}
                      disabled={o.exists}
                      className={styles.monthItem}
                    >
                      <Select.ItemIndicator>
                        <Checkmark size={14} />
                      </Select.ItemIndicator>
                      <Select.ItemText>{o.label}</Select.ItemText>
                      {o.exists ? (
                        <span className={styles.monthItemNote}>existiert</span>
                      ) : null}
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <button
          type="submit"
          className={ui.buttonPrimary}
          disabled={pending || !month}
        >
          {pending ? "Anlegen…" : "Anlegen"}
        </button>
      </form>
      <p className={ui.helper}>
        Anlegen ab dem aktuellen Monat, bis zu 3 Monate im Voraus
      </p>
      {state && "error" in state ? (
        <p className={ui.error}>{state.error}</p>
      ) : null}
    </div>
  );
}

export function EmptyCreateButton({
  ym,
  monthName,
}: {
  ym: string;
  monthName: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createSheet,
    undefined,
  );

  return (
    <form action={action}>
      <input type="hidden" name="month" value={ym} />
      <button type="submit" className={ui.buttonPrimary} disabled={pending}>
        {pending ? "Anlegen…" : `Blatt für ${monthName} anlegen`}
      </button>
      {state && "error" in state ? (
        <p className={ui.error}>{state.error}</p>
      ) : null}
    </form>
  );
}
