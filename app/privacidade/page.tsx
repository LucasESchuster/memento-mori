import type { Metadata } from "next";
import Link from "next/link";
import { FooterBar } from "@/components/FooterBar";
import { RevokeConsentButton } from "@/components/RevokeConsentButton";

export const metadata: Metadata = {
  title: "Política de Privacidade — Memento Mori",
  description:
    "Como o Memento Mori coleta, usa e protege seus dados pessoais, e como exercer seus direitos sob a LGPD.",
  alternates: {
    canonical: "/privacidade",
  },
};

const CONTACT_EMAIL = "lucasschusterr@gmail.com";
const UPDATED_AT = "4 de julho de 2026";

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[color:var(--rule)] py-10">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--ink-mute)]">
        {label}
      </div>
      <h2 className="mb-4 font-serif text-2xl font-normal text-[color:var(--ink)]">
        {title}
      </h2>
      <div className="flex flex-col gap-4 font-sans text-[15px] leading-relaxed text-[color:var(--ink-soft)] [&_a]:border-b [&_a]:border-[color:var(--ink-soft)] [&_a:hover]:text-[color:var(--ink)] [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-[color:var(--ink)]">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-7 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)] md:px-12">
        <Link href="/" className="flex items-center gap-3 transition-colors hover:text-[color:var(--ink)]">
          <span className="mm-breathe inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--terracotta)]" />
          <span>Tempus Fugit</span>
        </Link>
        <Link href="/" className="transition-colors hover:text-[color:var(--ink)]">
          ← início
        </Link>
      </header>

      <div className="mx-auto max-w-[720px] px-6 py-16 md:px-12 md:py-24">
        <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--terracotta)]">
          Aviso legal
        </div>
        <h1
          className="mb-6 font-serif font-normal text-[color:var(--ink)]"
          style={{ fontSize: "clamp(40px, 5.5vw, 64px)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
        >
          Política de <em className="text-[color:var(--terracotta)]">Privacidade</em>
        </h1>
        <p className="font-sans text-[17px] leading-relaxed text-[color:var(--ink-soft)]">
          Esta política descreve como o Memento Mori trata seus dados pessoais,
          em conformidade com a Lei Geral de Proteção de Dados (Lei nº
          13.709/2018 — LGPD).
        </p>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--ink-fade)]">
          Última atualização: {UPDATED_AT}
        </p>

        <div className="mt-10">
          <Section label="01" title="Quem é o controlador">
            <p>
              O responsável pelo tratamento dos seus dados (controlador) é{" "}
              <strong>Lucas Eduardo Schuster</strong>, mantenedor do Memento
              Mori. Para qualquer questão relativa a privacidade ou aos seus
              dados, entre em contato pelo email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section label="02" title="Quais dados coletamos">
            <p>Coletamos apenas o necessário para o funcionamento do serviço:</p>
            <ul className="flex flex-col gap-2">
              <li>
                <strong>Email</strong> — para enviar a confirmação de inscrição
                e os lembretes semanais.
              </li>
              <li>
                <strong>Data de nascimento</strong> e{" "}
                <strong>expectativa de vida</strong> — para calcular as semanas
                de vida exibidas e o conteúdo dos lembretes.
              </li>
              <li>
                <strong>Endereço IP</strong> — usado de forma temporária apenas
                para limitar tentativas abusivas de inscrição (proteção contra
                spam). Não é armazenado de forma permanente.
              </li>
              <li>
                <strong>Dados de navegação</strong> — coletados pela ferramenta
                Microsoft Clarity para entender o uso do site (ver seção 05).
              </li>
            </ul>
            <p>
              A visualização da sua vida em semanas na página inicial é
              calculada inteiramente no seu navegador e guardada apenas no seu
              dispositivo (armazenamento local). Esses valores só chegam aos
              nossos servidores se você optar por se inscrever nos lembretes.
            </p>
          </Section>

          <Section label="03" title="Para que usamos e com que base legal">
            <ul className="flex flex-col gap-2">
              <li>
                <strong>Envio dos lembretes semanais</strong> — com base no seu{" "}
                <strong>consentimento</strong> (LGPD, art. 7º, I), coletado no
                momento da inscrição e confirmado por email (double opt-in).
              </li>
              <li>
                <strong>Segurança e prevenção de abuso</strong> (limite de
                tentativas por IP) — com base no legítimo interesse (art. 7º,
                IX).
              </li>
              <li>
                <strong>Melhoria da experiência</strong> (analytics) — com base
                no seu <strong>consentimento</strong> (LGPD, art. 7º, I),
                coletado por um aviso no site. A análise só é ativada se você
                aceitar, e você pode revogar a qualquer momento (ver seção 05).
              </li>
            </ul>
          </Section>

          <Section label="04" title="Com quem compartilhamos">
            <p>
              Não vendemos nem alugamos seus dados. Compartilhamos o mínimo
              necessário com operadores que viabilizam o serviço:
            </p>
            <ul className="flex flex-col gap-2">
              <li>
                <strong>Resend</strong> — provedor de envio de email (recebe seu
                endereço de email para entregar as mensagens).
              </li>
              <li>
                <strong>Microsoft Clarity</strong> — ferramenta de análise de
                uso do site.
              </li>
            </ul>
            <p>
              Esses serviços podem processar dados fora do Brasil (ex.: Estados
              Unidos). Ao usar o serviço, você está ciente dessa transferência
              internacional, realizada nos termos do art. 33 da LGPD.
            </p>
          </Section>

          <Section label="05" title="Cookies e tecnologias de rastreamento">
            <p>
              Utilizamos o <strong>Microsoft Clarity</strong>, que emprega
              cookies e pode registrar interações (como cliques e rolagem) para
              nos ajudar a entender como o site é usado. Essa análise{" "}
              <strong>só é ativada após o seu consentimento</strong>: na sua
              primeira visita exibimos um aviso e o Clarity só carrega se você
              aceitar. Se você recusar, nenhum cookie de análise é criado.
            </p>
            <p>
              Você pode <strong>rever ou revogar</strong> essa escolha a
              qualquer momento: <RevokeConsentButton /> Também usamos o{" "}
              <strong>armazenamento local</strong> do navegador para lembrar os
              valores que você digitou na página inicial e a sua decisão sobre
              cookies — esses dados permanecem apenas no seu dispositivo.
            </p>
            <p>
              Além disso, você pode bloquear ou apagar cookies nas configurações
              do seu navegador a qualquer momento. Isso não impede o uso do
              serviço.
            </p>
          </Section>

          <Section label="06" title="Por quanto tempo guardamos">
            <p>
              Mantemos seu email e suas preferências enquanto sua inscrição
              estiver ativa. Se você cancelar, o registro é marcado como
              cancelado e deixamos de enviar emails. Você pode solicitar a{" "}
              <strong>exclusão definitiva</strong> dos seus dados a qualquer
              momento (ver seção 07).
            </p>
          </Section>

          <Section label="07" title="Seus direitos (LGPD, art. 18)">
            <p>
              Você pode, a qualquer momento e gratuitamente, exercer seus
              direitos de titular:
            </p>
            <ul className="flex flex-col gap-2">
              <li>
                <strong>Acessar e corrigir</strong> seus dados — pelo link
                “Editar preferências” presente em cada email semanal.
              </li>
              <li>
                <strong>Revogar o consentimento</strong> — pelo link de
                cancelamento (“descadastrar”) presente em cada email.
              </li>
              <li>
                <strong>Excluir definitivamente</strong> seus dados — pelo botão
                “Apagar meus dados” na página de edição de preferências, que
                remove permanentemente seu registro.
              </li>
            </ul>
            <p>
              Você também pode exercer qualquer desses direitos escrevendo para{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section label="08" title="Alterações nesta política">
            <p>
              Podemos atualizar esta política para refletir mudanças no serviço
              ou na legislação. A data da última atualização está indicada no
              topo desta página.
            </p>
          </Section>

          <Section label="09" title="Contato">
            <p>
              Dúvidas sobre esta política ou sobre o tratamento dos seus dados?
              Escreva para{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </Section>
        </div>
      </div>

      <FooterBar />
    </main>
  );
}
