import Link from "next/link";

export default function GestorTabs({ ativa }: { ativa: "cursos" | "colaboradores" | "relatorios" }) {
  const itens = [
    { id: "cursos", label: "Cursos", href: "/gestor" },
    { id: "colaboradores", label: "Colaboradores", href: "/gestor/colaboradores" },
    { id: "relatorios", label: "Relatorios", href: "/gestor/relatorios" },
  ] as const;

  return (
    <div className="tabs">
      {itens.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`tab ${ativa === item.id ? "active" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
