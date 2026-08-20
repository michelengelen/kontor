"use client";

import { colorVar } from "@/lib/colors";
import ui from "./ui.module.css";

export type ChipOption = {
  value: number | string;
  label: string;
  dotColor?: string;
};

// Single-select chip row. With `allowNone`, clicking the active chip
// deselects it.
export function ChoiceChips({
  options,
  value,
  onChange,
  allowNone = false,
  trailing,
}: {
  options: ChipOption[];
  value: number | string | null;
  onChange: (value: number | string | null) => void;
  allowNone?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <div className={ui.chipRow}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={active ? ui.chipBtnActive : ui.chipBtn}
            style={
              active && option.dotColor
                ? { borderColor: colorVar(option.dotColor) }
                : undefined
            }
            aria-pressed={active}
            onClick={() => {
              if (active && allowNone) onChange(null);
              else onChange(option.value);
            }}
          >
            {option.dotColor ? (
              <span
                className={ui.chipDot}
                style={{ background: colorVar(option.dotColor) }}
              />
            ) : null}
            {option.label}
          </button>
        );
      })}
      {trailing}
    </div>
  );
}
