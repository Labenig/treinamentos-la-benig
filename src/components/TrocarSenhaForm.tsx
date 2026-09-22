"use client";

import { useState, type FormEvent } from "react";

export default function TrocarSenhaForm() {
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (senha.length < 6) {
      e.preventDefault();
      setErroLocal("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      e.preventDefault();
      setErroLocal("As senhas nao coincidem.");
      return;
    }
    setErroLocal(null);
    setEnviando(true);
    // Deixa o form submeter de verdade (POST normal pro servidor): o
    // proprio navegador segue o redirect que a rota devolve, sem depender
    // de router.push do client continuar rodando depois do submit.
  }

  return (
    <form action="/api/trocar-senha" method="post" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="senha">
        Nova senha
      </label>
      <input
        id="senha"
        name="senha"
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
        name="confirmar"
        type="password"
        className="field-input"
        value={confirmar}
        onChange={(e) => setConfirmar(e.target.value)}
        required
        minLength={6}
        autoComplete="new-password"
      />

      {erroLocal && <p className="error-msg">{erroLocal}</p>}

      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {enviando ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
