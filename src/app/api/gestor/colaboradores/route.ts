import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: gestor } = await supabase
    .from("colaboradores")
    .select("papel, setor_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!gestor || gestor.papel !== "gestor") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const formData = await request.formData();
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const erroRedirect = (mensagem: string) => {
    const url = new URL("/gestor/colaboradores", request.url);
    url.searchParams.set("erro", encodeURIComponent(mensagem));
    return NextResponse.redirect(url);
  };

  if (!nome || !email) {
    return erroRedirect("Preencha nome e e-mail.");
  }

  const senhaPadrao = process.env.DEFAULT_PASSWORD;
  if (!senhaPadrao) {
    return erroRedirect("Senha padrao nao configurada no servidor (DEFAULT_PASSWORD).");
  }

  const admin = createAdminClient();

  const { data: novoUsuario, error: erroCriacao } = await admin.auth.admin.createUser({
    email,
    password: senhaPadrao,
    email_confirm: true,
  });

  if (erroCriacao || !novoUsuario.user) {
    return erroRedirect(erroCriacao?.message ?? "Nao foi possivel criar o usuario.");
  }

  const { error: erroInsert } = await admin.from("colaboradores").insert({
    id: novoUsuario.user.id,
    nome,
    email,
    setor_id: gestor.setor_id,
    papel: "colaborador",
    senha_trocada: false,
  });

  if (erroInsert) {
    await admin.auth.admin.deleteUser(novoUsuario.user.id);
    return erroRedirect("Nao foi possivel salvar o colaborador.");
  }

  const url = new URL("/gestor/colaboradores", request.url);
  url.searchParams.set(
    "msg",
    encodeURIComponent(`${nome} foi cadastrado(a) com a senha padrao.`)
  );
  return NextResponse.redirect(url);
}
