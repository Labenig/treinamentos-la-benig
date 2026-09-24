import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";
import { atualizarCurso, excluirCurso } from "@/app/gestor/actions";
import type { Curso, Setor } from "@/lib/database.types";

export default async function EditarCursoPage({
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

  const { data: todosSetores } = await supabase.from("setores").select("*").order("nome");
  const setores: Setor[] = todosSetores ?? [];

  const { data: setoresExtrasAtuais } = await supabase
    .from("curso_setores")
    .select("setor_id")
    .eq("curso_id", id);
  const setoresExtrasIds = new Set((setoresExtrasAtuais ?? []).map((s) => s.setor_id as string));

  return (
    <div className="app-shell">
      <main className="main">
        <Link href={`/gestor/cursos/${curso.id}`} className="back-btn">
          ← Voltar
        </Link>
        <p className="auth-title" style={{ marginBottom: 18 }}>
          Editar curso
        </p>

        <form action={atualizarCurso}>
          <input type="hidden" name="id" value={curso.id} />

          <label className="field-label" htmlFor="titulo">
            Titulo
          </label>
          <input id="titulo" name="titulo" className="field-input" defaultValue={curso.titulo} required />

          <label className="field-label" htmlFor="categoria">
            Categoria
          </label>
          <input id="categoria" name="categoria" className="field-input" defaultValue={curso.categoria ?? ""} />

          <label className="field-label" htmlFor="descricao">
            Descricao
          </label>
          <textarea
            id="descricao"
            name="descricao"
            className="field-input"
            rows={3}
            defaultValue={curso.descricao ?? ""}
          />

          <label className="field-label" htmlFor="letra">
            Letra do poster
          </label>
          <input id="letra" name="letra" className="field-input" maxLength={2} defaultValue={curso.letra ?? ""} />

          <label className="field-label" htmlFor="cor_inicio">
            Cor inicial do poster
          </label>
          <input
            id="cor_inicio"
            name="cor_inicio"
            type="color"
            className="field-input"
            defaultValue={curso.cor_inicio ?? "#fea10f"}
          />

          <label className="field-label" htmlFor="cor_fim">
            Cor final do poster
          </label>
          <input
            id="cor_fim"
            name="cor_fim"
            type="color"
            className="field-input"
            defaultValue={curso.cor_fim ?? "#e95b0c"}
          />

          <label className="field-label" htmlFor="ordem">
            Ordem de exibicao
          </label>
          <input id="ordem" name="ordem" type="number" className="field-input" defaultValue={curso.ordem} />

          <label className="opt" style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              name="visivel_todos_setores"
              defaultChecked={curso.visivel_todos_setores}
            />
            Visivel para todos os setores (nao so o dono)
          </label>

          {setores.length > 0 && (
            <>
              <label className="field-label" style={{ marginTop: 14 }}>
                Ou visivel so pra setores especificos (alem do dono do curso)
              </label>
              <p className="field-hint">Ignorado se &quot;todos os setores&quot; acima estiver marcado.</p>
              {setores
                .filter((setor) => setor.id !== curso.setor_id)
                .map((setor) => (
                  <label className="opt" key={setor.id}>
                    <input
                      type="checkbox"
                      name="setores_extra"
                      value={setor.id}
                      defaultChecked={setoresExtrasIds.has(setor.id)}
                    />
                    {setor.nome}
                  </label>
                ))}
            </>
          )}

          <button type="submit" className="btn btn-primary">
            Salvar alteracoes
          </button>
        </form>

        <form action={excluirCurso} style={{ marginTop: 10 }}>
          <input type="hidden" name="id" value={curso.id} />
          <button type="submit" className="btn btn-danger">
            Excluir curso
          </button>
        </form>
      </main>
    </div>
  );
}
