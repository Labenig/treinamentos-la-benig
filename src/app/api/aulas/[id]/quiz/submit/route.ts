import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Aula, Pergunta } from "@/lib/database.types";

interface RespostaEnviada {
  pergunta_id: string;
  opcao_index: number;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { data: aula } = await supabase
    .from("aulas")
    .select("*")
    .eq("id", id)
    .maybeSingle<Aula>();
  if (!aula) {
    return NextResponse.json({ error: "Aula nao encontrada." }, { status: 404 });
  }

  const { data: liberada } = await supabase.rpc("aula_esta_liberada", {
    p_colaborador_id: user.id,
    p_aula_id: id,
  });
  if (!liberada) {
    return NextResponse.json({ error: "Essa aula ainda esta bloqueada." }, { status: 403 });
  }

  let body: { respostas?: RespostaEnviada[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo invalido." }, { status: 400 });
  }

  const respostas = Array.isArray(body.respostas) ? body.respostas : [];
  const idsUnicos = [...new Set(respostas.map((r) => r.pergunta_id))];
  if (idsUnicos.length === 0) {
    return NextResponse.json({ error: "Nenhuma resposta enviada." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro de configuracao no servidor." },
      { status: 500 }
    );
  }
  const { data: perguntas } = await admin
    .from("perguntas")
    .select("id, correta")
    .eq("aula_id", id)
    .in("id", idsUnicos);

  const perguntasValidas = (perguntas ?? []) as Pick<Pergunta, "id" | "correta">[];
  const corretaPorId = new Map(perguntasValidas.map((p) => [p.id, p.correta]));

  let acertos = 0;
  let total = 0;
  for (const resposta of respostas) {
    const correta = corretaPorId.get(resposta.pergunta_id);
    if (correta === undefined) continue; // pergunta nao pertence a essa aula
    total += 1;
    if (resposta.opcao_index === correta) acertos += 1;
  }

  if (total === 0) {
    return NextResponse.json({ error: "Respostas invalidas." }, { status: 400 });
  }

  const nota = acertos / total;
  const aprovado = nota >= 0.7;

  await admin.from("tentativas_questionario").insert({
    colaborador_id: user.id,
    aula_id: id,
    perguntas_sorteadas: idsUnicos,
    acertos,
    total,
    nota,
    aprovado,
  });

  await supabase
    .from("progresso_aulas")
    .update({ aprovado })
    .eq("colaborador_id", user.id)
    .eq("aula_id", id);

  return NextResponse.json({ acertos, total, nota, aprovado });
}
