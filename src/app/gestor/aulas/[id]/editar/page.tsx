import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";
import { atualizarAula, enviarMaterial, excluirAula, excluirMaterial } from "@/app/gestor/actions";
import type { Aula, AulaMaterial } from "@/lib/database.types";

function formatarTamanho(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

  const { data: materiais } = await supabase
    .from("aula_materiais")
    .select("*")
    .eq("aula_id", id)
    .order("criado_em", { ascending: true });
  const listaMateriais = (materiais ?? []) as AulaMaterial[];

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

        <p className="row-title" style={{ marginTop: 28 }}>
          Materiais de apoio
        </p>
        <p className="field-hint" style={{ marginTop: -6 }}>
          PDF, Word, Excel, CSV e outros arquivos que o colaborador pode baixar junto com essa aula.
        </p>

        {listaMateriais.map((material) => (
          <div className="admin-row" key={material.id}>
            <div>
              <p className="admin-row-title">{material.nome_arquivo}</p>
              <p className="admin-row-sub">{formatarTamanho(material.tamanho_bytes)}</p>
            </div>
            <form action={excluirMaterial}>
              <input type="hidden" name="id" value={material.id} />
              <input type="hidden" name="aula_id" value={registro.id} />
              <button type="submit" className="icon-btn danger" aria-label="Excluir arquivo" title="Excluir arquivo">
                🗑
              </button>
            </form>
          </div>
        ))}

        {listaMateriais.length === 0 && (
          <p className="empty" style={{ marginTop: 4 }}>
            Nenhum material enviado ainda.
          </p>
        )}

        <form
          action={enviarMaterial}
          encType="multipart/form-data"
          style={{ marginTop: 14 }}
        >
          <input type="hidden" name="aula_id" value={registro.id} />
          <input
            type="file"
            name="arquivo"
            className="field-input"
            required
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
          />
          <button type="submit" className="btn btn-ghost btn-sm" style={{ width: "100%" }}>
            Enviar arquivo
          </button>
        </form>

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
