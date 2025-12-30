import type { PropType } from "vue";
import { makeStringProp } from "@/utils/props";

// --- Types ---
export interface CompNameOption {
  id: string;
  label: string;
}

// --- Constants ---
export const COMP_NAME_VARIANTS = ["default", "primary", "danger"] as const;

// --- Props ---
export const compNameProps = {
  /** Brief description of what this prop controls */
  variant: makeStringProp<"default" | "primary" | "danger">("default"),

  /** Required prop with complex type */
  data: {
    type: Object as PropType<CompNameOption>,
    required: true,
  },

  /** Optional boolean prop */
  disabled: makeBooleanProp(false),
};

// --- Emits ---
export const compNameEmits = {
  /** Emitted when user confirms action */
  confirm: (value: string) => true,

  /** Emitted when user cancels */
  cancel: () => true,
};

// --- Utilities ---
/** Helper function for consumers */
export function compNameHelper(input: string): string {
  // Implementation
  return input.toUpperCase();
}
