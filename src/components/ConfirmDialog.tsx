import { useState } from "react";

export interface DialogRequest {
  title: string;
  message?: string;
  mode: "confirm" | "prompt" | "alert";
  defaultValue?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: (value?: string) => void;
}

interface Props {
  request: DialogRequest;
  onClose: () => void;
}

export default function ConfirmDialog({ request, onClose }: Props) {
  const [value, setValue] = useState(request.defaultValue ?? "");

  function confirm() {
    request.onConfirm(request.mode === "prompt" ? value : undefined);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="dialog-panel" onClick={(e) => e.stopPropagation()}>
        <h3>{request.title}</h3>
        {request.message && <p>{request.message}</p>}
        {request.mode === "prompt" && (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirm();
              if (e.key === "Escape") onClose();
            }}
          />
        )}
        <div className="dialog-actions">
          <button className={request.danger ? "danger" : ""} onClick={confirm}>
            {request.confirmLabel ?? (request.mode === "prompt" ? "Valider" : request.mode === "alert" ? "OK" : "Confirmer")}
          </button>
          {request.mode !== "alert" && (
            <button className="ghost" onClick={onClose}>
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
