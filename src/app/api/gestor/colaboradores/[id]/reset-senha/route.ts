import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const { data: gestor } = await supabase
    .from("colaboradores")
    .select("papel, setor_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!gestor || gestor.papel !== "gestor") {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  const url = new URL("/gestor/colaboradores", request.url);

  // So pode resetar senha de quem e do mesmo setor (RLS ja garante isso na
  // leitura, mas confere de novo aqui antes de chamar a admin API). Gestor
  // geral (setor_id nulo) pode resetar senha de qualquer setor.
  const ehGestorGeral = gestor.setor_id === null;
  const { data: alvo } = await supabase
    .from("colaboradores")
    .select("id, nome, setor_id")
    .eq("id", id)
    .maybeSingle();

  if (!alvo || (!ehGestorGeral && alvo.setor_id !== gestor.setor_id)) {
    url.searchParams.set("erro", encodeURIComponent("Colaborador nao encontrado."));
    return NextResponse.redirect(url, 303);
  }

  const senhaPadrao = process.env.DEFAULT_PASSWORD;
  if (!senhaPadrao) {
    url.searchParams.set(
      "erro",
      encodeURIComponent("Senha padrao nao configurada no servidor (DEFAULT_PASSWORD).")
    );
    return NextResponse.redirect(url, 303);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    url.searchParams.set(
      "erro",
      encodeURIComponent(e instanceof Error ? e.message : "Erro de configuracao no servidor.")
    );
    return NextResponse.redirect(url, 303);
  }
  const { error } = await admin.auth.admin.updateUserById(id, { password: senhaPadrao });

  if (error) {
    url.searchParams.set("erro", encodeURIComponent("Nao foi possivel resetar a senha."));
    return NextResponse.redirect(url, 303);
  }

  await admin.from("colaboradores").update({ senha_trocada: false }).eq("id", id);

  url.searchParams.set(
    "msg",
    encodeURIComponent(`A senha de ${alvo.nome} foi resetada para a senha padrao.`)
  );
  return NextResponse.redirect(url, 303);
}
