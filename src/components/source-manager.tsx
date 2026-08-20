"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { OverflowMenuHorizontal } from "@carbon/icons-react";
import {
  createSource,
  deleteSource,
  setDefaultSource,
  type FormState,
} from "@/app/template/actions";
import type { PaymentSource } from "@/db/schema";
import { ConfirmDialog } from "./confirm-dialog";
import ui from "./ui.module.css";
import styles from "./manager.module.css";

export type SourceWithCount = PaymentSource & { count: number };

export function SourceManager({
  sources,
  trigger,
  triggerClass,
}: {
  sources: SourceWithCount[];
  trigger: React.ReactNode;
  triggerClass: string;
}) {
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [createState, createAction, createPending] = useActionState<
    FormState,
    FormData
  >(async (prev, formData) => {
    const result = await createSource(prev, formData);
    if (result && "ok" in result) formRef.current?.reset();
    return result;
  }, undefined);

  const deleting = sources.find((s) => s.id === deletingId);
  const defaultSource = sources.find((s) => s.isDefault);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={triggerClass}>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={ui.backdrop} />
        <Dialog.Popup className={ui.popup}>
          <p className={ui.dialogEyebrow}>Vorlage</p>
          <Dialog.Title className={ui.dialogTitle}>
            Zahlungsquellen
          </Dialog.Title>

          <ul className={styles.list}>
            {sources.map((source) => (
              <li key={source.id} className={styles.row}>
                <span className={styles.name}>{source.name}</span>
                {source.isDefault ? (
                  <span className={ui.tagAccent}>Standard</span>
                ) : null}
                <span className={ui.leader} aria-hidden />
                <span className={styles.count}>
                  {source.count} {source.count === 1 ? "Eintrag" : "Einträge"}
                </span>
                {!source.isDefault ? (
                  <Menu.Root>
                    <Menu.Trigger
                      className={ui.menuTrigger}
                      aria-label={`Aktionen für ${source.name}`}
                    >
                      <OverflowMenuHorizontal size={18} />
                    </Menu.Trigger>
                    <Menu.Portal>
                      <Menu.Positioner sideOffset={4} align="end">
                        <Menu.Popup className={ui.menuPopup}>
                          <Menu.Item
                            className={ui.menuItem}
                            onClick={() =>
                              startTransition(() => setDefaultSource(source.id))
                            }
                          >
                            Als Standard festlegen
                          </Menu.Item>
                          <Menu.Item
                            className={ui.menuItemDanger}
                            onClick={() => setDeletingId(source.id)}
                          >
                            Löschen
                          </Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                ) : null}
              </li>
            ))}
          </ul>

          <form ref={formRef} action={createAction} className={styles.createForm}>
            <input
              name="name"
              required
              placeholder="Neue Quelle…"
              aria-label="Name der neuen Quelle"
              className={styles.createInput}
            />
            <button type="submit" className={ui.button} disabled={createPending}>
              Anlegen
            </button>
          </form>
          {createState && "error" in createState ? (
            <p className={ui.error}>{createState.error}</p>
          ) : null}

          <p className={ui.helper}>
            Die Standardquelle wird an Posten nicht angezeigt — nur
            Abweichungen (z.&nbsp;B. PAYPAL) erscheinen als Tag.
          </p>

          <Dialog.Close className={`${ui.buttonPrimaryWide} ${styles.done}`}>Fertig</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>

      <ConfirmDialog
        open={deletingId !== null}
        onOpenChange={(next) => {
          if (!next) setDeletingId(null);
        }}
        title="Quelle löschen?"
        body={
          deleting ? (
            <>
              Einträge mit „{deleting.name}“ wechseln zur Standardquelle
              {defaultSource ? <> „{defaultSource.name}“</> : null}. Alte
              Blätter behalten ihren Vermerk.
            </>
          ) : null
        }
        confirmLabel="Löschen"
        action={async () => {
          if (deletingId) await deleteSource(deletingId);
          setDeletingId(null);
        }}
      />
    </Dialog.Root>
  );
}
