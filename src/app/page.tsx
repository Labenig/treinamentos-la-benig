import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getColaboradorAtual } from "@/lib/auth";
import type { Curso } from "@/lib/database.types";

export default async function Home() {
  const colaborador = await getColaboradorAtual();
  const supabase = await createClient();

  const { data: cursos } = await supabase
    .from("cursos")
    .select("*")
    .order("categoria", { ascending: true, nullsFirst: true })
    .order("ordem", { ascending: true });

  const lista = (cursos ?? []) as Curso[];
  const cursoIds = lista.map((c) => c.id);

  // Total de aulas por curso + quantas o colaborador ja assistiu, pra
  // desenhar a barrinha de progresso no poster de cada curso.
  const progressoPorCurso = new Map<string, { total: number; feitas: number }>();

  if (cursoIds.length > 0) {
    const { data: aulas } = await supabase
      .from("aulas")
      .select("id, capitulos!inner(curso_id)");

    type AulaComCurso = { id: string; capitulos: { curso_id: string } | { curso_id: string }[] };
    const aulaParaCurso = new Map<string, string>();
    for (const a of (aulas ?? []) as unknown as AulaComCurso[]) {
      const cap = Array.isArray(a.capitulos) ? a.capitulos[0] : a.capitulos;
      if (!cap) continue;
      aulaParaCurso.set(a.id, cap.curso_id);
      const atual = progressoPorCurso.get(cap.curso_id) ?? { total: 0, feitas: 0 };
      atual.total += 1;
      progressoPorCurso.set(cap.curso_id, atual);
    }

    const { data: progresso } = await supabase
      .from("progresso_aulas")
      .select("aula_id")
      .eq("colaborador_id", colaborador.id)
      .not("assistiu_em", "is", null);

    for (const p of progresso ?? []) {
      const cursoId = aulaParaCurso.get(p.aula_id);
      if (!cursoId) continue;
      const atual = progressoPorCurso.get(cursoId) ?? { total: 0, feitas: 0 };
      atual.feitas += 1;
      progressoPorCurso.set(cursoId, atual);
    }
  }

  const categorias = new Map<string, Curso[]>();
  for (const curso of lista) {
    const categoria = curso.categoria ?? "Outros";
    const arr = categorias.get(categoria) ?? [];
    arr.push(curso);
    categorias.set(categoria, arr);
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          La <b>Benig</b>
        </div>
        <div className="topbar-actions">
          {colaborador.papel === "gestor" && (
            <Link href="/gestor" className="pill">
              Painel do gestor
            </Link>
          )}
          <Link href="/trocar-senha" className="pill">
            {colaborador.nome.split(" ")[0]}
          </Link>
          <form action="/api/logout" method="post">
            <button type="submit" className="pill">
              Sair
            </button>
          </form>
        </div>
      </div>

      <main className="main">
        {colaborador.papel === "gestor" && (
          <span className="gestor-badge">Gestor · {colaborador.setor_nome}</span>
        )}

        {categorias.size === 0 && (
          <p className="empty">
            Nenhum curso disponivel para o seu setor ainda. Fale com o gestor
            do seu time.
          </p>
        )}

        {[...categorias.entries()].map(([categoria, cursosDaCategoria]) => (
          <section key={categoria}>
            <p className="row-title">{categoria}</p>
            <div className="row">
              {cursosDaCategoria.map((curso) => {
                const prog = progressoPorCurso.get(curso.id);
                const pct =
                  prog && prog.total > 0
                    ? Math.round((prog.feitas / prog.total) * 100)
                    : 0;
                return (
                  <Link key={curso.id} href={`/cursos/${curso.id}`} className="card">
                    <div
                      className="poster"
                      style={{
                        background: `linear-gradient(135deg, ${curso.cor_inicio ?? "#c9a227"}, ${
                          curso.cor_fim ?? "#7a5c12"
                        })`,
                      }}
                    >
                      {curso.letra ?? curso.titulo.charAt(0)}
                      {pct > 0 && (
                        <span className="prog" style={{ width: `${pct}%` }} />
                      )}
                    </div>
                    <p className="card-title">{curso.titulo}</p>
                    {curso.descricao && <p className="card-sub">{curso.descricao}</p>}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
