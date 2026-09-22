import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Troca de senha do 1o acesso (e tambem trocas voluntarias depois). Feita
// inteira aqui no servidor com a admin API em vez de no client: assim
// nao ha risco de o passo "marcar senha_trocada = true" falhar em
// silencio (sem essa marca, o middleware manda a pessoa de volta pra
// essa mesma pagina pra sempre, e do jeito antigo o erro nao aparecia).
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const senha = String(formData.get("senha") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  const erroRedirect = (mensagem: string) => {
    const url = new URL("/trocar-senha", request.url);
    url.searchParams.set("erro", encodeURIComponent(mensagem));
    return NextResponse.redirect(url);
  };

  if (senha.length < 6) {
    return erroRedirect("A senha precisa ter pelo menos 6 caracteres.");
  }
  if (senha !== confirmar) {
    return erroRedirect("As senhas nao coincidem.");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return erroRedirect(e instanceof Error ? e.message : "Erro de configuracao no servidor.");
  }

  const { error: erroSenha } = await admin.auth.admin.updateUserById(user.id, {
    password: senha,
  });
  if (erroSenha) {
    return erroRedirect("Nao foi possivel atualizar a senha. Tente novamente.");
  }

  const { error: erroFlag } = await admin
    .from("colaboradores")
    .update({ senha_trocada: true })
    .eq("id", user.id);
  if (erroFlag) {
    return erroRedirect(
      "A senha foi trocada, mas houve um erro ao liberar seu acesso. Fale com o gestor."
    );
  }

  return NextResponse.redirect(new URL("/", request.url));
}
