import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";
import { atualizarCapitulo, excluirCapitulo } from "@/app/gestor/actions";
import type { Capitulo } from "@/lib/database.types";

export default async function EditarCapituloPage({
  params,
}: {
  params: Promise<{ capId: string }>;
}) {
  const { capId } = await params;
  await getGestorAtual();
  const supabase = await createClient();

  const { data: capitulo } = await supabase
    .from("capitulos")
    .select("*")
    .eq("id", capId)
    .maybeSingle<Capitulo>();

  if (!capitulo) {
    notFound();
  }

  return (
    <div className="app-shell">
      <main className="main">
        <Link href={`/gestor/cursos/${capitulo.curso_id}`} className="back-btn">
          ← Voltar
        </Link>
        <p className="auth-title" style={{ marginBottom: 18 }}>
          Editar capitulo
        </p>

        <form action={atualizarCapitulo}>
          <input type="hidden" name="id" value={capitulo.id} />
          <input type="hidden" name="curso_id" value={capitulo.curso_id} />

          <label className="field-label" htmlFor="titulo">
            Titulo
          </label>
          <input id="titulo" name="titulo" className="field-input" defaultValue={capitulo.titulo} required />

          <label className="field-label" htmlFor="ordem">
            Ordem
          </label>
          <input id="ordem" name="ordem" type="number" className="field-input" defaultValue={capitulo.ordem} />

          <button type="submit" className="btn btn-primary">
            Salvar alteracoes
          </button>
        </form>

        <form action={excluirCapitulo} style={{ marginTop: 10 }}>
          <input type="hidden" name="id" value={capitulo.id} />
          <input type="hidden" name="curso_id" value={capitulo.curso_id} />
          <p className="field-hint">
            Excluir o capitulo tambem exclui todas as aulas e perguntas dele.
          </p>
          <button type="submit" className="btn btn-danger">
            Excluir capitulo
          </button>
        </form>
      </main>
    </div>
  );
}
