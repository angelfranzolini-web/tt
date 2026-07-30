import { useState, type ReactNode } from "react";
import { login, TOKEN_KEY } from "../backend";

interface Props {
  children: (token: string, logout: () => void) => ReactNode;
}

export default function LoginGate({ children }: Props) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const newToken = await login(password);
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de connexion.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  if (token) return <>{children(token, logout)}</>;

  return (
    <div className="login-gate">
      <div className="login-panel">
        <h1>🗂️ SysView</h1>
        <p>Accès réservé — entrez le mot de passe partagé de l'équipe.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Mot de passe"
        />
        {error && <div className="login-error">{error}</div>}
        <button disabled={loading || !password} onClick={submit}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </div>
    </div>
  );
}
