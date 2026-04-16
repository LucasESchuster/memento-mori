import Link from "next/link";
import { prisma } from "@/lib/db";
import { EditForm } from "@/components/EditForm";

type SearchParams = Promise<{ token?: string | string[] }>;

function Shell({
  subtitle,
  children,
}: {
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[600px] flex-col gap-16 px-6 py-16 md:py-24">
      <header className="flex flex-col gap-3">
        <h1 className="font-serif text-5xl font-light tracking-tight text-neutral-900 md:text-6xl">
          Memento Mori
        </h1>
        <p className="font-serif text-lg italic text-neutral-500">{subtitle}</p>
      </header>
      {children}
      <footer className="mt-auto border-t border-neutral-200 pt-6 font-serif text-xs tracking-wide text-neutral-400">
        tempus fugit, memento mori.
      </footer>
    </main>
  );
}

function Message({ text }: { text: string }) {
  return (
    <section className="flex flex-col gap-6 border-t border-neutral-200 pt-8">
      <p className="text-base leading-7 text-neutral-700">{text}</p>
      <Link
        href="/"
        className="font-serif text-sm italic text-neutral-500 underline"
      >
        Voltar ao início
      </Link>
    </section>
  );
}

export default async function EditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;
  const tokenStr = typeof token === "string" ? token : null;

  if (!tokenStr) {
    return (
      <Shell subtitle="link inválido.">
        <Message text="Token ausente. Use o link de edição enviado por email." />
      </Shell>
    );
  }

  const sub = await prisma.subscription.findUnique({
    where: { unsubscribeToken: tokenStr },
    select: {
      email: true,
      birthYear: true,
      lifeExpectancy: true,
      unsubscribedAt: true,
    },
  });

  if (!sub) {
    return (
      <Shell subtitle="link inválido.">
        <Message text="Não encontramos esta inscrição. O link pode ter expirado." />
      </Shell>
    );
  }

  if (sub.unsubscribedAt) {
    return (
      <Shell subtitle="inscrição cancelada.">
        <Message text="Esta inscrição foi cancelada. Para voltar a receber, inscreva-se novamente na página inicial." />
      </Shell>
    );
  }

  return (
    <Shell subtitle="editar lembretes.">
      <EditForm
        token={tokenStr}
        email={sub.email}
        initialBirthYear={sub.birthYear}
        initialLifeExpectancy={sub.lifeExpectancy}
      />
    </Shell>
  );
}

export const dynamic = "force-dynamic";
