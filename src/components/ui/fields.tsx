import type { ReactNode } from "react";

interface SegmentedProps<T extends string> {
  legend: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ legend, name, options, value, onChange }: SegmentedProps<T>) {
  return (
    <fieldset className="group span2">
      <legend>{legend}</legend>
      <div className="seg" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map((option) => (
          <label key={option.value}>
            <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isRequired?: boolean;
  isInteger?: boolean;
  hint?: ReactNode;
  isWide?: boolean;
}

export function NumberField({ label, value, onChange, placeholder = "0", isRequired = false, isInteger = false, hint, isWide = false }: NumberFieldProps) {
  return (
    <label className={isWide ? "f span2" : "f"}>
      {label}
      <input
        type="number"
        inputMode={isInteger ? "numeric" : "decimal"}
        min="0"
        step={isInteger ? "1" : "any"}
        placeholder={placeholder}
        required={isRequired}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint}
    </label>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  min?: string;
}

export function DateField({ label, value, onChange, isRequired = true, min }: DateFieldProps) {
  return (
    <label className="f">
      {label}
      <input type="date" required={isRequired} min={min} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

interface NotesFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function NotesField({ label, value, onChange, placeholder, maxLength = 2000 }: NotesFieldProps) {
  return (
    <label className="f span2">
      {label}
      <textarea rows={3} maxLength={maxLength} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
