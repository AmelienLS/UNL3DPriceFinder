import { useState, useEffect, useRef } from "react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  style?: React.CSSProperties;
}

export default function NumberInput({ value, onChange, step, min, max, style }: Props) {
  const [display, setDisplay] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocused = useRef(false);

  // Sync display when value changes externally (not while user is typing)
  useEffect(() => {
    if (!isFocused.current) {
      setDisplay(String(value));
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value;

    // Replace comma with period
    raw = raw.replace(",", ".");

    // Allow empty, minus, or valid partial number (e.g. "3.", "0.5")
    if (raw === "" || raw === "-" || raw === "." || raw === "-.") {
      setDisplay(raw);
      if (raw === "" || raw === "." || raw === "-") {
        onChange(0);
      }
      return;
    }

    // Reject anything that isn't a valid partial float
    if (!/^-?\d*\.?\d*$/.test(raw)) return;

    setDisplay(raw);

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      const clamped =
        min !== undefined && parsed < min
          ? min
          : max !== undefined && parsed > max
            ? max
            : parsed;
      onChange(clamped);
    }
  }

  function handleFocus() {
    isFocused.current = true;
    // Select all on focus for easy replacement
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function handleBlur() {
    isFocused.current = false;
    // Clean up display on blur
    if (display === "" || display === "." || display === "-" || display === "-.") {
      setDisplay("0");
      onChange(0);
    } else {
      // Normalize: remove trailing dot, unnecessary leading zeros
      const parsed = parseFloat(display);
      if (!isNaN(parsed)) {
        setDisplay(String(parsed));
        onChange(parsed);
      }
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      step={step}
      style={{ textAlign: "right", ...style }}
    />
  );
}
