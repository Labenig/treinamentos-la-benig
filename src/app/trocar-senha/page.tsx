import Link from "next/link";
import TrocarSenhaForm from "@/components/TrocarSenhaForm";

export default async function TrocarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <div className="center-screen">
      <div className="auth-card">
        <p className="auth-title">Trocar senha</p>
        <p className="auth-sub">
          Defina uma nova senha para sua conta. Ela sera usada nos proximos
          acessos.
        </p>

        {erro && <p className="error-msg">{decodeURIComponent(erro)}</p>}

        <TrocarSenhaForm />

        <div style={{ marginTop: 14, textAlign: "center" }}>
          <Link href="/" className="back-btn" style={{ justifyContent: "center" }}>
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}
