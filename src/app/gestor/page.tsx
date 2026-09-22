import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";
import GestorTabs from "@/components/GestorTabs";
import type { Curso } from "@/lib/database.types";

export default async function GestorPage() {
  const gestor = await getGestorAtual();
  const ehGestorGeral = gestor.setor_id === null;
  const supabase = await createClient();

  // Gestor de setor ve so o proprio (RLS ja cuida disso); gestor geral ve
  // os cursos de todos os setores. Sempre junta o nome do setor (fica null
  // quando nao aplicavel, o embed do PostgREST e um left join).
  let cursosQuery = supabase
    .from("cursos")
    .select("*, setores(nome)")
    .order("categoria", { ascending: true, nullsFirst: true })
    .order("ordem", { ascending: true });
  if (!ehGestorGeral) {
    cursosQuery = cursosQuery.eq("setor_id", gestor.setor_id);
  }
  const { data: cursosData } = await cursosQuery;
  const cursos = cursosData as unknown as (Curso & { setores: { nome: string } | null })[] | null;

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
        <GestorTabs ativa="cursos" />

        <Link href="/gestor/cursos/novo" className="btn btn-primary" style={{ marginBottom: 18 }}>
          + Novo curso
        </Link>

        {(cursos ?? []).length === 0 && (
          <p className="empty">Nenhum curso cadastrado ainda.</p>
        )}

        {(cursos ?? []).map((curso) => (
          <Link key={curso.id} href={`/gestor/cursos/${curso.id}`} className="admin-row" style={{ textDecoration: "none" }}>
            <div>
              <p className="admin-row-title">{curso.titulo}</p>
              <p className="admin-row-sub">
                {curso.categoria ?? "Sem categoria"}
                {ehGestorGeral && curso.setores?.nome ? ` · ${curso.setores.nome}` : ""}
                {curso.visivel_todos_setores ? " · visivel para todos os setores" : ""}
              </p>
            </div>
            <span className="icon-btn">→</span>
          </Link>
        ))}
      </main>
    </div>
  );
}
