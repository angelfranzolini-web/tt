import { useState } from "react";

interface Props {
  buildLink: () => string;
  label?: string;
}

export default function ShareButton({ buildLink, label = "🔗 Partager" }: Props) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  function handleClick() {
    setLink(buildLink());
    setCopied(false);
  }

  return (
    <div className="share-button-wrap">
      <button type="button" className="share-trigger" onClick={handleClick}>
        {label}
      </button>
      {link && (
        <div className="share-popover">
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
          <button
            type="button"
            key={pulseKey}
            className={copied ? "copy-btn just-copied" : "copy-btn"}
            onClick={async () => {
              await navigator.clipboard.writeText(link).catch(() => {});
              setCopied(true);
              setPulseKey((k) => k + 1);
            }}
          >
            {copied ? "✓ Copié !" : "Copier"}
          </button>
          <button type="button" className="ghost" onClick={() => setLink(null)}>
            Fermer
          </button>
          <p>Lien permanent, sans expiration. Il montre uniquement cette vue, en lecture seule.</p>
        </div>
      )}
    </div>
  );
}
