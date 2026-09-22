import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * Cliente Supabase para uso em Server Components, Server Actions e Route
 * Handlers. Usa os cookies da sessao do usuario logado, entao toda query
 * feita com ele respeita o RLS (colaborador so ve o que pode ver, gestor
 * so edita o proprio setor etc).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chamado de um Server Component sem permissao de escrita;
            // o middleware cuida de manter a sessao atualizada.
          }
        },
      },
    }
  );
}
