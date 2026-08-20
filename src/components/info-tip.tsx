"use client";

import { Popover } from "@base-ui/react/popover";
import ui from "./ui.module.css";

// Small explanatory popover for icon-only UI. Opens on hover and
// focus on desktop and on tap on touch devices.
export function InfoTip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={150}
        className={ui.tipTrigger}
        aria-label={label}
      >
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6}>
          <Popover.Popup className={ui.tipPopup}>{label}</Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
