import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getColaboradorAtual } from "@/lib/auth";
import type { Aula, Capitulo, Curso, TrilhaAula } from "@/lib/database.types";

export default async function CursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const colaborador = await getColaboradorAtual();
  const supabase = await createClient();

  const { data: curso } = await supabase
    .from("cursos")
    .select("*")
    .eq("id", id)
    .maybeSingle<Curso>();

  if (!curso) {
    notFound();
  }

  const { data: capitulos } = await supabase
    .from("capitulos")
    .select("*")
    .eq("curso_id", id)
    .order("ordem", { ascending: true })
    .order("id", { ascending: true });

  const capituloIds = (capitulos ?? []).map((c) => c.id);

  const { data: aulas } = capituloIds.length
    ? await supabase
        .from("aulas")
        .select("*")
        .in("capitulo_id", capituloIds)
        .order("ordem", { ascending: true })
        .order("id", { ascending: true })
    : { data: [] as Aula[] };

  const { data: trilha } = await supabase.rpc("trilha_curso", {
    p_colaborador_id: colaborador.id,
    p_curso_id: id,
  });

  const statusPorAula = new Map<string, TrilhaAula>();
  for (const t of (trilha ?? []) as TrilhaAula[]) {
    statusPorAula.set(t.aula_id, t);
  }

  const aulasPorCapitulo = new Map<string, Aula[]>();
  for (const aula of (aulas ?? []) as Aula[]) {
    const arr = aulasPorCapitulo.get(aula.capitulo_id) ?? [];
    arr.push(aula);
    aulasPorCapitulo.set(aula.capitulo_id, arr);
  }

  // Acha a primeira aula ainda nao concluida (pra destacar como "proxima").
  let proximaAulaId: string | null = null;
  for (const aula of (aulas ?? []) as Aula[]) {
    const status = statusPorAula.get(aula.id);
    const concluida = !!status?.assistiu_em && (!status.tem_quiz || !!status.aprovado);
    if (!concluida) {
      proximaAulaId = aula.id;
      break;
    }
  }

  return (
    <div className="app-shell">
      <main className="main">
        <Link href="/" className="back-btn">
          ← Voltar
        </Link>

        <div
          className="curso-hero"
          style={{
            background: `linear-gradient(135deg, ${curso.cor_inicio ?? "#fea10f"}, ${
              curso.cor_fim ?? "#e95b0c"
            })`,
          }}
        >
          <h1>{curso.titulo}</h1>
        </div>

        {curso.descricao && <p className="curso-desc">{curso.descricao}</p>}

        <p className="trilha-label">Trilha de aprendizado</p>

        {(capitulos ?? []).map((capitulo: Capitulo) => {
          const aulasDoCapitulo = aulasPorCapitulo.get(capitulo.id) ?? [];
          if (aulasDoCapitulo.length === 0) return null;
          return (
            <div key={capitulo.id}>
              {(capitulos ?? []).length > 1 && (
                <p className="row-title">{capitulo.titulo}</p>
              )}
              {aulasDoCapitulo.map((aula) => {
                const status = statusPorAula.get(aula.id);
                const liberada = status?.liberada ?? false;
                const concluida =
                  !!status?.assistiu_em && (!status.tem_quiz || !!status.aprovado);
                const ehProxima = aula.id === proximaAulaId;

                let icone = "🔒";
                let iconeClasse = "locked";
                let statusTexto = "Bloqueada";

                if (concluida) {
                  icone = "✓";
                  iconeClasse = "done";
                  statusTexto = "Concluida";
                } else if (liberada) {
                  icone = ehProxima ? "▶" : "○";
                  iconeClasse = ehProxima ? "next" : "";
                  statusTexto =
                    status?.assistiu_em && status.tem_quiz
                      ? "Assistida · faltando o questionario"
                      : "Disponivel";
                }

                const conteudo = (
                  <>
                    <span className={`lesson-icon ${iconeClasse}`}>{icone}</span>
                    <div>
                      <p className="lesson-title">{aula.titulo}</p>
                      <p className="lesson-status">
                        {aula.duracao ? `${aula.duracao} · ` : ""}
                        {statusTexto}
                      </p>
                    </div>
                  </>
                );

                if (!liberada) {
                  return (
                    <div key={aula.id} className="lesson locked" aria-disabled>
                      {conteudo}
                    </div>
                  );
                }

                return (
                  <Link
                    key={aula.id}
                    href={`/cursos/${curso.id}/aulas/${aula.id}`}
                    className="lesson"
                  >
                    {conteudo}
                  </Link>
                );
              })}
            </div>
          );
        })}

        {(aulas ?? []).length === 0 && (
          <p className="empty">Esse curso ainda nao tem aulas cadastradas.</p>
        )}
      </main>
    </div>
  );
}
