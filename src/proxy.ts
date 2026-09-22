import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Forca troca de senha no primeiro acesso antes de liberar o resto do
  // site. IMPORTANTE: precisa excluir tambem /api/trocar-senha (a rota que
  // de fato troca a senha), nao so /trocar-senha (a pagina). Sem isso, o
  // proprio POST do formulario de troca de senha era interceptado aqui —
  // senha_trocada ainda era false nesse momento — e redirecionado de volta
  // pra /trocar-senha antes de chegar na rota que troca a senha de verdade:
  // por fora parecia que o botao "nao fazia nada".
  if (user && !isPublic && path !== "/trocar-senha" && path !== "/api/trocar-senha") {
    const { data: colaborador } = await supabase
      .from("colaboradores")
      .select("senha_trocada")
      .eq("id", user.id)
      .maybeSingle();

    if (colaborador && colaborador.senha_trocada === false) {
      const url = request.nextUrl.clone();
      url.pathname = "/trocar-senha";
      return NextResponse.redirect(url, 303);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
