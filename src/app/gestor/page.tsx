import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";
import GestorTabs from "@/components/GestorTabs";
import type { Curso } from "@/lib/database.types";

export default async function GestorPage() {
  const gestor = await getGestorAtual();
  const supabase = await createClient();

  const { data: cursos } = await supabase
    .from("cursos")
    .select("*")
    .eq("setor_id", gestor.setor_id)
    .order("categoria", { ascending: true, nullsFirst: true })
    .order("ordem", { ascending: true });

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
        <span className="gestor-badge">Gestor · {gestor.setor_nome}</span>
        <GestorTabs ativa="cursos" />

        <Link href="/gestor/cursos/novo" className="btn btn-primary" style={{ marginBottom: 18 }}>
          + Novo curso
        </Link>

        {(cursos ?? []).length === 0 && (
          <p className="empty">Nenhum curso cadastrado para o seu setor ainda.</p>
        )}

        {(cursos ?? []).map((curso: Curso) => (
          <Link key={curso.id} href={`/gestor/cursos/${curso.id}`} className="admin-row" style={{ textDecoration: "none" }}>
            <div>
              <p className="admin-row-title">{curso.titulo}</p>
              <p className="admin-row-sub">
                {curso.categoria ?? "Sem categoria"}
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
