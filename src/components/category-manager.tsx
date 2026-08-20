"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { Close, Edit } from "@carbon/icons-react";
import {
  createCategory,
  deleteCategory,
  setCategoryColor,
  type CreateCategoryState,
} from "@/app/template/actions";
import { CATEGORY_COLORS, colorVar } from "@/lib/colors";
import type { Category } from "@/db/schema";
import { ConfirmDialog } from "./confirm-dialog";
import ui from "./ui.module.css";
import styles from "./manager.module.css";

export type CategoryWithCount = Category & { count: number };

export function CategoryManager({
  categories,
  trigger,
  triggerClass,
}: {
  categories: CategoryWithCount[];
  trigger: React.ReactNode;
  triggerClass: string;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [createState, createAction, createPending] = useActionState<
    CreateCategoryState,
    FormData
  >(async (prev, formData) => {
    const result = await createCategory(prev, formData);
    if (result && "ok" in result) formRef.current?.reset();
    return result;
  }, undefined);

  const deleting = categories.find((c) => c.id === deletingId);

  function pickColor(id: number, color: string) {
    setColorError(null);
    startTransition(async () => {
      const result = await setCategoryColor(id, color);
      if (result && "error" in result) setColorError(result.error);
      else setEditingId(null);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={triggerClass}>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={ui.backdrop} />
        <Dialog.Popup className={ui.popup}>
          <p className={ui.dialogEyebrow}>Vorlage</p>
          <Dialog.Title className={ui.dialogTitle}>Kategorien</Dialog.Title>

          <ul className={styles.list}>
            {categories.map((cat) => (
              <li key={cat.id}>
                <div
                  className={
                    editingId === cat.id ? styles.rowActive : styles.row
                  }
                >
                  <span
                    className={ui.chipDot}
                    style={{ background: colorVar(cat.color) }}
                  />
                  <span className={styles.name}>{cat.name}</span>
                  <span className={styles.count}>
                    {cat.count} {cat.count === 1 ? "Eintrag" : "Einträge"}
                  </span>
                  <span className={ui.leader} aria-hidden />
                  <Menu.Root>
                    <Menu.Trigger
                      className={ui.menuTrigger}
                      aria-label={`Aktionen für ${cat.name}`}
                    >
                      <Edit size={14} />
                    </Menu.Trigger>
                    <Menu.Portal>
                      <Menu.Positioner sideOffset={4} align="end">
                        <Menu.Popup className={ui.menuPopup}>
                          <Menu.Item
                            className={ui.menuItem}
                            onClick={() => {
                              setColorError(null);
                              setEditingId(
                                editingId === cat.id ? null : cat.id,
                              );
                            }}
                          >
                            Farbe ändern
                          </Menu.Item>
                          <Menu.Item
                            className={ui.menuItemDanger}
                            onClick={() => setDeletingId(cat.id)}
                          >
                            Löschen
                          </Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                </div>

                {editingId === cat.id ? (
                  <div
                    className={styles.editPanel}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setEditingId(null);
                      }
                    }}
                  >
                    <div className={styles.editHead}>
                      <p className={styles.editLabel}>
                        Farbe für „{cat.name}“
                      </p>
                      <button
                        type="button"
                        className={styles.editClose}
                        aria-label="Farbauswahl schließen"
                        onClick={() => setEditingId(null)}
                      >
                        <Close size={16} />
                      </button>
                    </div>
                    <div className={styles.swatches}>
                      {CATEGORY_COLORS.map((slot) => {
                        const takenBy = categories.find(
                          (c) => c.color === slot && c.id !== cat.id,
                        );
                        const selected = cat.color === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            className={
                              selected
                                ? styles.swatchSelected
                                : takenBy
                                  ? styles.swatchTaken
                                  : styles.swatch
                            }
                            style={{ background: colorVar(slot) }}
                            disabled={Boolean(takenBy)}
                            aria-label={
                              takenBy ? `${slot} — vergeben` : slot
                            }
                            onClick={() => pickColor(cat.id, slot)}
                          />
                        );
                      })}
                    </div>
                    {colorError ? (
                      <p className={ui.error}>{colorError}</p>
                    ) : null}
                    <p className={ui.helper}>
                      12 feste Slots — vergebene Farben sind durchgestrichen.
                    </p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          {categories.length < 12 ? (
            <form ref={formRef} action={createAction} className={styles.createForm}>
              <input
                name="name"
                autoComplete="off"
                data-1p-ignore
                required
                placeholder="Neue Kategorie…"
                aria-label="Name der neuen Kategorie"
                className={styles.createInput}
              />
              <button
                type="submit"
                className={ui.button}
                disabled={createPending}
              >
                Anlegen
              </button>
            </form>
          ) : (
            <p className={ui.helper}>Alle 12 Farben sind vergeben.</p>
          )}
          {createState && "error" in createState ? (
            <p className={ui.error}>{createState.error}</p>
          ) : null}

          <Dialog.Close className={`${ui.buttonPrimaryWide} ${styles.done}`}>Fertig</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>

      <ConfirmDialog
        open={deletingId !== null}
        onOpenChange={(next) => {
          if (!next) setDeletingId(null);
        }}
        title="Kategorie löschen?"
        body={
          deleting ? (
            <>
              „{deleting.name}“ wird aus allen Einträgen und alten Blättern
              entfernt. Die Ausgaben bleiben.
            </>
          ) : null
        }
        confirmLabel="Löschen"
        action={async () => {
          if (deletingId) await deleteCategory(deletingId);
          setDeletingId(null);
        }}
      />
    </Dialog.Root>
  );
}
