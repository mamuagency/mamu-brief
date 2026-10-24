import { useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  id, label, optional, hint, error, children,
}: {
  id: string; label: string; optional?: string | undefined; hint?: string | undefined; error?: string | undefined; children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm font-medium">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-muted-foreground">{optional}</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-ring aria-[invalid=true]:border-destructive";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { invalid, className, ...rest } = props;
  return <input {...rest} aria-invalid={invalid || undefined} className={cn(inputBase, className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea rows={3} {...rest} className={cn(inputBase, "resize-y min-h-24", className)} />;
}

/** Pill group for single (radio) or multiple (checkbox) choice. `max` caps multi-select. */
export function ChoiceGroup<T extends string>({
  name, legend, options, labels, value, onChange, multiple, max, error, optional, hint,
}: {
  name: string; legend: string; options: readonly T[]; labels: Record<T, string>;
  value: T | "" | T[]; onChange: (v: T | "" | T[]) => void; multiple?: boolean | undefined;
  max?: number | undefined;
  error?: string | undefined; optional?: string | undefined; hint?: string | undefined;
}) {
  const selected = (o: T) => (Array.isArray(value) ? value.includes(o) : value === o);
  const atMax = !!multiple && Array.isArray(value) && max !== undefined && value.length >= max;
  const toggle = (o: T) => {
    if (multiple && Array.isArray(value)) {
      if (selected(o)) onChange(value.filter((v) => v !== o));
      else if (!atMax) onChange([...value, o]);
    } else onChange(selected(o) ? "" : o);
  };
  return (
    <fieldset className="space-y-3" aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="flex w-full items-baseline justify-between gap-3 text-sm font-medium">
        <span>{legend}</span>
        {optional && <span className="text-xs font-normal text-muted-foreground">{optional}</span>}
      </legend>
      {hint && <p className="-mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected(o);
          const disabled = atMax && !on;
          return (
            <label
              key={o}
              className={cn(
                "group inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/50 hover:bg-accent",
                disabled && "cursor-not-allowed opacity-40 hover:border-border hover:bg-background",
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={name}
                className="sr-only"
                checked={on}
                disabled={disabled}
                onChange={() => toggle(o)}
                onClick={(e) => {
                  // allow un-selecting a radio by clicking it again
                  if (!multiple && on) { e.preventDefault(); toggle(o); }
                }}
              />
              {on && <Check className="size-3.5" aria-hidden />}
              {labels[o]}
            </label>
          );
        })}
      </div>
      {error && <p id={`${name}-error`} role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </fieldset>
  );
}

/** Collapsible category groups of pill checkboxes (visual identity applications). */
export function CategoryGroup({
  name, legend, hint, optional, categories, catLabels, labels, value, onChange, error,
}: {
  name: string; legend: string; hint?: string | undefined; optional?: string | undefined;
  categories: readonly { id: string; items: readonly string[] }[];
  catLabels: Record<string, string>; labels: Record<string, string>;
  value: string[]; onChange: (v: string[]) => void; error?: string | undefined;
}) {
  const [open, setOpen] = useState<string | null>(categories[0]?.id ?? null);
  const toggle = (item: string) =>
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  return (
    <fieldset className="space-y-3" aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="flex w-full items-baseline justify-between gap-3 text-sm font-medium">
        <span>{legend}</span>
        {optional && <span className="text-xs font-normal text-muted-foreground">{optional}</span>}
      </legend>
      {hint && <p className="-mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="space-y-2">
        {categories.map((cat) => {
          const count = cat.items.filter((i) => value.includes(i)).length;
          const isOpen = open === cat.id;
          return (
            <div key={cat.id} className="overflow-hidden rounded-xl border bg-background">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : cat.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                <span>{catLabels[cat.id] ?? cat.id}</span>
                <span className="flex items-center gap-2">
                  {count > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{count}</span>
                  )}
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
                </span>
              </button>
              {isOpen && (
                <div className="flex flex-wrap gap-2 border-t px-4 py-3">
                  {cat.items.map((item) => {
                    const on = value.includes(item);
                    return (
                      <label
                        key={item}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs transition-all",
                          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:border-primary/50 hover:bg-accent",
                        )}
                      >
                        <input
                          type="checkbox"
                          name={`${name}-${cat.id}`}
                          className="sr-only"
                          checked={on}
                          onChange={() => toggle(item)}
                        />
                        {on && <Check className="size-3" aria-hidden />}
                        {labels[item] ?? item}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {error && <p id={`${name}-error`} role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </fieldset>
  );
}