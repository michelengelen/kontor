"use client";

import { useRouter } from "next/navigation";
import { Select } from "@base-ui/react/select";
import { ArrowRight, Checkmark, ChevronDown } from "@carbon/icons-react";
import ui from "@/components/ui.module.css";
import styles from "./vergleich.module.css";

export type SheetOption = { ym: string; label: string };

function SheetSelect({
  options,
  value,
  label,
  onChange,
}: {
  options: SheetOption[];
  value: string;
  label: string;
  onChange: (ym: string) => void;
}) {
  return (
    <Select.Root
      items={options.map((o) => ({ value: o.ym, label: o.label }))}
      value={value}
      onValueChange={(v) => onChange(v as string)}
    >
      <Select.Trigger className={ui.selectTriggerMono} aria-label={label}>
        <Select.Value />
        <Select.Icon>
          <ChevronDown size={16} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={4}>
          <Select.Popup className={ui.selectPopup}>
            <Select.List>
              {options.map((o) => (
                <Select.Item key={o.ym} value={o.ym} className={ui.selectItem}>
                  <Select.ItemIndicator>
                    <Checkmark size={14} />
                  </Select.ItemIndicator>
                  <Select.ItemText>{o.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

export function ComparePicker({
  options,
  a,
  b,
}: {
  options: SheetOption[];
  a: string;
  b: string;
}) {
  const router = useRouter();

  function navigate(nextA: string, nextB: string) {
    router.push(`/vergleich?a=${nextA}&b=${nextB}`);
  }

  return (
    <div className={styles.picker}>
      <SheetSelect
        options={options}
        value={a}
        label="Blatt A"
        onChange={(ym) => navigate(ym, b)}
      />
      <ArrowRight size={16} className={styles.pickerArrow} />
      <SheetSelect
        options={options}
        value={b}
        label="Blatt B"
        onChange={(ym) => navigate(a, ym)}
      />
    </div>
  );
}
