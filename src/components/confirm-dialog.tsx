"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@base-ui/react/dialog";
import ui from "./ui.module.css";

// Confirmation for destructive actions. `action` is a bound server
// action. Works uncontrolled (pass `trigger`) or controlled (pass
// `open` + `onOpenChange`, e.g. from a row menu).
export function ConfirmDialog({
  trigger,
  triggerClass,
  open: controlledOpen,
  onOpenChange,
  title,
  body,
  confirmLabel,
  action,
}: {
  trigger?: React.ReactNode;
  triggerClass?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  action: () => Promise<void>;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  function confirm() {
    startTransition(async () => {
      await action();
      setOpen(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {trigger ? (
        <Dialog.Trigger className={triggerClass ?? ui.buttonGhost} aria-label={title}>
          {trigger}
        </Dialog.Trigger>
      ) : null}
      <Dialog.Portal>
        <Dialog.Backdrop className={ui.backdrop} />
        <Dialog.Popup className={ui.popupCenter}>
          <Dialog.Title className={ui.dialogTitle}>{title}</Dialog.Title>
          <Dialog.Description>{body}</Dialog.Description>
          <div className={ui.dialogActions}>
            <Dialog.Close className={ui.button}>Abbrechen</Dialog.Close>
            <button
              type="button"
              className={ui.buttonDangerSolid}
              onClick={confirm}
              disabled={pending}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
