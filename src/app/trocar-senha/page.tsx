"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function TrocarSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas nao coincidem.");
      return;
    }

    setCarregando(true);
    const supabase = createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setErro("Sessao expirada. Faca login novamente.");
      setCarregando(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: senha });
    if (updateError) {
      setErro("Nao foi possivel atualizar a senha. Tente novamente.");
      setCarregando(false);
      return;
    }

    await supabase
      .from("colaboradores")
      .update({ senha_trocada: true })
      .eq("id", userData.user.id);

    setCarregando(false);
    setSucesso(true);
    router.refresh();
    setTimeout(() => router.push("/"), 900);
  }

  return (
    <div className="center-screen">
      <div className="auth-card">
        <p className="auth-title">Trocar senha</p>
        <p className="auth-sub">
          Defina uma nova senha para sua conta. Ela sera usada nos proximos
          acessos.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="senha">
            Nova senha
          </label>
          <input
            id="senha"
            type="password"
            className="field-input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            autoFocus
          />

          <label className="field-label" htmlFor="confirmar">
            Confirmar nova senha
          </label>
          <input
            id="confirmar"
            type="password"
            className="field-input"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />

          {erro && <p className="error-msg">{erro}</p>}
          {sucesso && <p className="success-msg">Senha atualizada! Redirecionando...</p>}

          <button type="submit" className="btn btn-primary" disabled={carregando}>
            {carregando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        <div style={{ marginTop: 14, textAlign: "center" }}>
          <Link href="/" className="back-btn" style={{ justifyContent: "center" }}>
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}
