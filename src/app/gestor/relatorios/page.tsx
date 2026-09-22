import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";
import GestorTabs from "@/components/GestorTabs";
import type { Colaborador, Curso } from "@/lib/database.types";

export default async function RelatoriosPage() {
  const gestor = await getGestorAtual();
  const ehGestorGeral = gestor.setor_id === null;
  const supabase = await createClient();

  let colaboradoresQuery = supabase
    .from("colaboradores")
    .select("*")
    .order("nome", { ascending: true });
  if (!ehGestorGeral) {
    colaboradoresQuery = colaboradoresQuery.eq("setor_id", gestor.setor_id);
  }
  const { data: colaboradores } = await colaboradoresQuery;

  let cursosQuery = supabase
    .from("cursos")
    .select("*")
    .order("ordem", { ascending: true });
  if (!ehGestorGeral) {
    cursosQuery = cursosQuery.eq("setor_id", gestor.setor_id);
  }
  const { data: cursos } = await cursosQuery;

  const listaColaboradores = (colaboradores ?? []) as Colaborador[];
  const listaCursos = (cursos ?? []) as Curso[];
  const cursoIds = listaCursos.map((c) => c.id);

  const aulaParaCurso = new Map<string, string>();
  const aulasPorCurso = new Map<string, number>();

  if (cursoIds.length > 0) {
    const { data: aulas } = await supabase
      .from("aulas")
      .select("id, capitulos!inner(curso_id)")
      .in("capitulos.curso_id", cursoIds);

    type AulaComCurso = { id: string; capitulos: { curso_id: string } | { curso_id: string }[] };
    for (const a of (aulas ?? []) as unknown as AulaComCurso[]) {
      const cap = Array.isArray(a.capitulos) ? a.capitulos[0] : a.capitulos;
      if (!cap) continue;
      aulaParaCurso.set(a.id, cap.curso_id);
      aulasPorCurso.set(cap.curso_id, (aulasPorCurso.get(cap.curso_id) ?? 0) + 1);
    }
  }

  // progresso_concluido[colaboradorId][cursoId] = quantidade de aulas concluidas
  const progressoConcluido = new Map<string, Map<string, number>>();

  if (listaColaboradores.length > 0 && aulaParaCurso.size > 0) {
    const { data: progresso } = await supabase
      .from("progresso_aulas")
      .select("colaborador_id, aula_id")
      .in(
        "colaborador_id",
        listaColaboradores.map((c) => c.id)
      )
      .not("assistiu_em", "is", null);

    for (const p of progresso ?? []) {
      const cursoId = aulaParaCurso.get(p.aula_id);
      if (!cursoId) continue;
      const porCurso = progressoConcluido.get(p.colaborador_id) ?? new Map<string, number>();
      porCurso.set(cursoId, (porCurso.get(cursoId) ?? 0) + 1);
      progressoConcluido.set(p.colaborador_id, porCurso);
    }
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
        <GestorTabs ativa="relatorios" />

        {listaCursos.length === 0 && (
          <p className="empty">Cadastre cursos pra acompanhar o progresso do time.</p>
        )}

        {listaCursos.map((curso) => {
          const totalAulas = aulasPorCurso.get(curso.id) ?? 0;
          return (
            <div key={curso.id} style={{ marginBottom: 22 }}>
              <p className="row-title">{curso.titulo}</p>
              {totalAulas === 0 && <p className="empty">Sem aulas cadastradas.</p>}
              {totalAulas > 0 &&
                listaColaboradores.map((colaborador) => {
                  const feitas = progressoConcluido.get(colaborador.id)?.get(curso.id) ?? 0;
                  const pct = Math.round((feitas / totalAulas) * 100);
                  return (
                    <div key={colaborador.id} className="admin-row">
                      <div>
                        <p className="admin-row-title">{colaborador.nome}</p>
                        <p className="admin-row-sub">
                          {feitas}/{totalAulas} aulas concluidas
                        </p>
                      </div>
                      <span
                        className="gestor-badge"
                        style={{
                          margin: 0,
                          background: pct >= 100 ? "rgba(94,169,122,0.16)" : undefined,
                          color: pct >= 100 ? "var(--success)" : undefined,
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </main>
    </div>
  );
}
