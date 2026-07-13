import { useRef, useEffect } from "react";

/**
 * OTPInput — 6-box OTP entry with auto-advance, paste support, backspace.
 */
export default function OTPInput({ value = "", onChange, disabled }) {
  const inputs = useRef([]);
  const digits = (value + "      ").slice(0, 6).split("");

  const update = (idx, char) => {
    const next = digits.map((d, i) => (i === idx ? char : d));
    onChange(next.join("").replace(/ /g, ""));
  };

  const handleKey = (e, idx) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[idx] !== " " && digits[idx] !== "") {
        update(idx, " ");
      } else if (idx > 0) {
        inputs.current[idx - 1]?.focus();
        update(idx - 1, " ");
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleChange = (e, idx) => {
    const char = e.target.value.replace(/\D/, "").slice(-1);
    if (!char) return;
    update(idx, char);
    if (idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
  };

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          disabled={disabled}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKey(e, i)}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-slate-900 text-white transition-all focus:outline-none focus:border-violet-500 border-slate-700 disabled:opacity-50"
        />
      ))}
    </div>
  );
}