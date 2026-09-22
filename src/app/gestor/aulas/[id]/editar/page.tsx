import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";
import { atualizarAula, excluirAula } from "@/app/gestor/actions";
import type { Aula } from "@/lib/database.types";

export default async function EditarAulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getGestorAtual();
  const supabase = await createClient();

  const { data: aula } = await supabase
    .from("aulas")
    .select("*, capitulos(curso_id, titulo)")
    .eq("id", id)
    .maybeSingle();

  if (!aula) {
    notFound();
  }

  const registro = aula as unknown as Aula & {
    capitulos: { curso_id: string; titulo: string } | null;
  };
  const cursoId = registro.capitulos?.curso_id ?? "";

  return (
    <div className="app-shell">
      <main className="main">
        <Link href={`/gestor/cursos/${cursoId}`} className="back-btn">
          ← Voltar
        </Link>
        <p className="auth-title" style={{ marginBottom: 4 }}>
          Editar aula
        </p>
        <p className="admin-row-sub" style={{ marginBottom: 18 }}>
          Capitulo: {registro.capitulos?.titulo}
        </p>

        <form action={atualizarAula}>
          <input type="hidden" name="id" value={registro.id} />
          <input type="hidden" name="curso_id" value={cursoId} />

          <label className="field-label" htmlFor="titulo">
            Titulo da aula
          </label>
          <input id="titulo" name="titulo" className="field-input" defaultValue={registro.titulo} required />

          <label className="field-label" htmlFor="video_url">
            Link do video (embed do OneDrive)
          </label>
          <input
            id="video_url"
            name="video_url"
            className="field-input"
            defaultValue={registro.video_url ?? ""}
            placeholder="https://..."
          />

          <label className="field-label" htmlFor="duracao">
            Duracao (opcional)
          </label>
          <input id="duracao" name="duracao" className="field-input" defaultValue={registro.duracao ?? ""} />

          <label className="field-label" htmlFor="perguntas_por_tentativa">
            Perguntas sorteadas por tentativa
          </label>
          <input
            id="perguntas_por_tentativa"
            name="perguntas_por_tentativa"
            type="number"
            className="field-input"
            defaultValue={registro.perguntas_por_tentativa}
            min={0}
          />

          <label className="field-label" htmlFor="ordem">
            Ordem
          </label>
          <input id="ordem" name="ordem" type="number" className="field-input" defaultValue={registro.ordem} />

          <button type="submit" className="btn btn-primary">
            Salvar alteracoes
          </button>
        </form>

        <Link href={`/gestor/aulas/${registro.id}/perguntas`} className="btn btn-ghost" style={{ marginTop: 10 }}>
          Gerenciar banco de perguntas
        </Link>

        <form action={excluirAula} style={{ marginTop: 10 }}>
          <input type="hidden" name="id" value={registro.id} />
          <input type="hidden" name="curso_id" value={cursoId} />
          <button type="submit" className="btn btn-danger">
            Excluir aula
          </button>
        </form>
      </main>
    </div>
  );
}
