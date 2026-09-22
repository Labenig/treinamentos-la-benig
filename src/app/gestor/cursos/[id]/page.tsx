import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";
import { criarCapitulo, excluirCapitulo } from "@/app/gestor/actions";
import type { Aula, Capitulo, Curso } from "@/lib/database.types";

export default async function GestorCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getGestorAtual();
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

  const aulasPorCapitulo = new Map<string, Aula[]>();
  for (const aula of (aulas ?? []) as Aula[]) {
    const arr = aulasPorCapitulo.get(aula.capitulo_id) ?? [];
    arr.push(aula);
    aulasPorCapitulo.set(aula.capitulo_id, arr);
  }

  return (
    <div className="app-shell">
      <main className="main">
        <Link href="/gestor" className="back-btn">
          ← Voltar
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <p className="auth-title" style={{ marginBottom: 4 }}>
              {curso.titulo}
            </p>
            {curso.descricao && <p className="admin-row-sub">{curso.descricao}</p>}
          </div>
          <Link href={`/gestor/cursos/${curso.id}/editar`} className="btn btn-ghost btn-sm">
            Editar curso
          </Link>
        </div>

        <p className="row-title">Capitulos e aulas</p>

        {(capitulos ?? []).map((capitulo: Capitulo) => (
          <div key={capitulo.id} style={{ marginBottom: 18 }}>
            <div className="admin-row">
              <div>
                <p className="admin-row-title">{capitulo.titulo}</p>
                <p className="admin-row-sub">
                  {(aulasPorCapitulo.get(capitulo.id) ?? []).length} aula(s)
                </p>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <Link
                  href={`/gestor/capitulos/${capitulo.id}/editar?curso_id=${curso.id}`}
                  className="icon-btn"
                >
                  ✎
                </Link>
                <form action={excluirCapitulo}>
                  <input type="hidden" name="id" value={capitulo.id} />
                  <input type="hidden" name="curso_id" value={curso.id} />
                  <button type="submit" className="icon-btn danger">
                    🗑
                  </button>
                </form>
              </div>
            </div>

            {(aulasPorCapitulo.get(capitulo.id) ?? []).map((aula) => (
              <Link
                key={aula.id}
                href={`/gestor/aulas/${aula.id}/editar`}
                className="admin-row"
                style={{ marginLeft: 16, textDecoration: "none" }}
              >
                <div>
                  <p className="admin-row-title">{aula.titulo}</p>
                  <p className="admin-row-sub">
                    {aula.video_url ? "Video cadastrado" : "Sem video"}
                    {" · "}
                    {aula.perguntas_por_tentativa} pergunta(s) por tentativa
                  </p>
                </div>
                <span className="icon-btn">✎</span>
              </Link>
            ))}

            <Link
              href={`/gestor/capitulos/${capitulo.id}/aulas/novo?curso_id=${curso.id}`}
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 16, marginTop: 6 }}
            >
              + Nova aula
            </Link>
          </div>
        ))}

        <p className="row-title">Novo capitulo</p>
        <form action={criarCapitulo}>
          <input type="hidden" name="curso_id" value={curso.id} />
          <label className="field-label" htmlFor="titulo">
            Titulo do capitulo
          </label>
          <input id="titulo" name="titulo" className="field-input" required />
          <label className="field-label" htmlFor="ordem">
            Ordem
          </label>
          <input
            id="ordem"
            name="ordem"
            type="number"
            className="field-input"
            defaultValue={(capitulos ?? []).length}
          />
          <button type="submit" className="btn btn-primary">
            Adicionar capitulo
          </button>
        </form>
      </main>
    </div>
  );
}
