"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro("E-mail ou senha invalidos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="center-screen">
      <div className="auth-card">
        <p className="auth-title">
          La <b style={{ color: "var(--accent)" }}>Benig</b>
        </p>
        <p className="auth-sub">Entre com o e-mail e a senha da sua conta.</p>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />

          <label className="field-label" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            className="field-input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="current-password"
          />

          {erro && <p className="error-msg">{erro}</p>}

          <button type="submit" className="btn btn-primary" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
