import { useEffect, useRef, useState } from "react";

export interface AutocompleteOption {
  id: string;
  label: string;
}

interface Props {
  options: AutocompleteOption[];
  placeholder?: string;
  onSelect: (option: AutocompleteOption) => void;
  // Enter with no matching suggestion falls back to this (used by the
  // "Personnes assignées" field, so a name not yet in the registry can still
  // be added on the fly). Omit to only ever allow picking from the list.
  onSelectFreeText?: (text: string) => void;
  // false keeps the picked label showing in the box (single-select fields
  // like "Site / zone"); true clears it back to empty after each pick
  // (multi-add fields like "Personnes assignées").
  clearOnSelect?: boolean;
  // Controlled display value — used when clearOnSelect is false so the box
  // reflects the current selection even when the user isn't typing.
  value?: string;
}

export default function Autocomplete({
  options,
  placeholder,
  onSelect,
  onSelectFreeText,
  clearOnSelect = true,
  value,
}: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clearOnSelect) setQuery(value ?? "");
  }, [value, clearOnSelect]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const needle = query.trim().toLowerCase();
  const filtered = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;

  function choose(option: AutocompleteOption) {
    onSelect(option);
    setQuery(clearOnSelect ? "" : option.label);
    setOpen(false);
    setHighlight(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlight]) {
        choose(filtered[highlight]);
      } else if (onSelectFreeText && query.trim()) {
        onSelectFreeText(query.trim());
        setQuery(clearOnSelect ? "" : query.trim());
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="autocomplete" ref={wrapRef}>
      <input
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && filtered.length > 0 && (
        <ul className="autocomplete-list">
          {filtered.map((o, i) => (
            <li
              key={o.id}
              className={i === highlight ? "active" : ""}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o);
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
