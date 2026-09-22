import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";
import GestorTabs from "@/components/GestorTabs";
import { atualizarPapelColaborador } from "@/app/gestor/actions";
import type { Colaborador, Setor } from "@/lib/database.types";

export default async function ColaboradoresPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const gestor = await getGestorAtual();
  const ehGestorGeral = gestor.setor_id === null;
  const { msg, erro } = await searchParams;
  const supabase = await createClient();

  // Gestor de setor ve so o proprio time (RLS ja filtra); gestor geral ve
  // todo mundo. Sempre junta o nome do setor pra exibir (fica null quando
  // nao aplicavel, o embed do PostgREST e um left join).
  let colaboradoresQuery = supabase
    .from("colaboradores")
    .select("*, setores(nome)")
    .order("nome", { ascending: true });
  if (!ehGestorGeral) {
    colaboradoresQuery = colaboradoresQuery.eq("setor_id", gestor.setor_id);
  }
  const { data: colaboradoresData } = await colaboradoresQuery;
  const colaboradores = colaboradoresData as unknown as
    | (Colaborador & { setores: { nome: string } | null })[]
    | null;

  let setores: Setor[] = [];
  if (ehGestorGeral) {
    const { data } = await supabase.from("setores").select("*").order("nome");
    setores = data ?? [];
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          La <b>Benig</b>
        </div>
        <div className="topbar-actions">
          <Link href="/" className="pill">
            Ver plataforma
          </Link>
        </div>
      </div>

      <main className="main">
        <span className="gestor-badge">Gestor · {gestor.setor_nome ?? "Todos os setores"}</span>
        <GestorTabs ativa="colaboradores" />

        {msg && <p className="success-msg">{decodeURIComponent(msg)}</p>}
        {erro && <p className="error-msg">{decodeURIComponent(erro)}</p>}

        <p className="row-title">{ehGestorGeral ? "Todos os colaboradores" : "Time do setor"}</p>

        {(colaboradores ?? []).length === 0 && (
          <p className="empty">Nenhum colaborador cadastrado ainda.</p>
        )}

        {(colaboradores ?? []).map((colaborador) => (
          <div key={colaborador.id} className="admin-row" style={{ flexWrap: "wrap" }}>
            <div>
              <p className="admin-row-title">{colaborador.nome}</p>
              <p className="admin-row-sub">
                {colaborador.email} ·{" "}
                {colaborador.papel === "gestor" ? "Gestor" : "Colaborador"}
                {ehGestorGeral && colaborador.setores?.nome ? ` · ${colaborador.setores.nome}` : ""}
                {colaborador.senha_trocada ? "" : " · ainda na senha padrao"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <form action={atualizarPapelColaborador}>
                <input type="hidden" name="id" value={colaborador.id} />
                <input
                  type="hidden"
                  name="papel"
                  value={colaborador.papel === "gestor" ? "colaborador" : "gestor"}
                />
                <button type="submit" className="btn btn-ghost btn-sm">
                  {colaborador.papel === "gestor" ? "Tornar colaborador" : "Tornar gestor"}
                </button>
              </form>
              <form action={`/api/gestor/colaboradores/${colaborador.id}/reset-senha`} method="post">
                <button type="submit" className="btn btn-ghost btn-sm">
                  Resetar senha
                </button>
              </form>
            </div>
          </div>
        ))}

        <p className="row-title">Adicionar colaborador</p>
        <form action="/api/gestor/colaboradores" method="post">
          {ehGestorGeral && (
            <>
              <label className="field-label" htmlFor="setor_id">
                Setor
              </label>
              <select id="setor_id" name="setor_id" className="field-input" required defaultValue="">
                <option value="" disabled>
                  Selecione o setor
                </option>
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </>
          )}

          <label className="field-label" htmlFor="nome">
            Nome
          </label>
          <input id="nome" name="nome" className="field-input" required />

          <label className="field-label" htmlFor="email">
            E-mail
          </label>
          <input id="email" name="email" type="email" className="field-input" required />

          <p className="field-hint">
            A conta e criada com a senha padrao da empresa. No primeiro
            acesso, a pessoa sera obrigada a trocar a senha.
          </p>

          <button type="submit" className="btn btn-primary">
            Criar colaborador
          </button>
        </form>
      </main>
    </div>
  );
}
