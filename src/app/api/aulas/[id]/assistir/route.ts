import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
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
    .select("id")
    .eq("id", id)
    .maybeSingle();
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

  const { data: temQuiz } = await supabase.rpc("aula_tem_quiz", { p_aula_id: id });

  const { data: existente } = await supabase
    .from("progresso_aulas")
    .select("id, aprovado")
    .eq("colaborador_id", user.id)
    .eq("aula_id", id)
    .maybeSingle();

  const agora = new Date().toISOString();

  if (existente) {
    await supabase
      .from("progresso_aulas")
      .update({
        assistiu_em: agora,
        aprovado: temQuiz ? existente.aprovado : true,
      })
      .eq("id", existente.id);
  } else {
    await supabase.from("progresso_aulas").insert({
      colaborador_id: user.id,
      aula_id: id,
      assistiu_em: agora,
      aprovado: !temQuiz,
    });
  }

  return NextResponse.json({ ok: true, tem_quiz: !!temQuiz });
}
