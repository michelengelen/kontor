"use client";

import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { Edit } from "@carbon/icons-react";
import { deleteEntry } from "@/app/template/actions";
import { formatCents } from "@/lib/money";
import type { Category, PaymentSource, TemplateEntry } from "@/db/schema";
import { ConfirmDialog } from "./confirm-dialog";
import { EntryDialog } from "./entry-dialog";
import ui from "./ui.module.css";

export function EntryRowActions({
  entry,
  categories,
  sources,
}: {
  entry: TemplateEntry;
  categories: Category[];
  sources: PaymentSource[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          className={ui.menuTrigger}
          aria-label={`Aktionen für ${entry.name}`}
        >
          <Edit size={14} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={4} align="end">
            <Menu.Popup className={ui.menuPopup}>
              <Menu.Item
                className={ui.menuItem}
                onClick={() => setEditOpen(true)}
              >
                Bearbeiten
              </Menu.Item>
              <Menu.Item
                className={ui.menuItemDanger}
                onClick={() => setDeleteOpen(true)}
              >
                Löschen
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <EntryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        categories={categories}
        sources={sources}
        entry={entry}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eintrag löschen?"
        body={
          <>
            „{entry.name}“ (
            <span className={ui.mono}>{formatCents(entry.amountCents)}</span>)
            erscheint auf neuen Blättern nicht mehr. Bestehende Blätter
            behalten ihn.
          </>
        }
        confirmLabel="Löschen"
        action={deleteEntry.bind(null, entry.id)}
      />
    </>
  );
}
