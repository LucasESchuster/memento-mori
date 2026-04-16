import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { LifeStats } from "@/lib/calculations";
import type { Quote } from "@/lib/quotes";

type Props = {
  currentWeek: number;
  totalWeeks: number;
  stats: LifeStats;
  quote: Quote;
  appUrl: string;
  unsubscribeUrl: string;
  editUrl: string;
};

function fmt(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function WeeklyEmail({
  currentWeek,
  totalWeeks,
  stats,
  quote,
  appUrl,
  unsubscribeUrl,
  editUrl,
}: Props) {
  const weeksRemaining = Math.max(0, totalWeeks - currentWeek);

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        {`Semana ${fmt(currentWeek)} de ${fmt(totalWeeks)} — ${stats.percentLived.toFixed(1)}% vivido.`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={title}>Memento Mori</Text>
          <Text style={subtitle}>lembre-se de que vais morrer.</Text>

          <Section style={section}>
            <Text style={big}>
              Você completou a semana{" "}
              <strong style={strong}>{fmt(currentWeek)}</strong> da sua vida.
            </Text>
            <Text style={paragraph}>
              De aproximadamente {fmt(totalWeeks)} semanas que compõem a sua
              expectativa, restam cerca de{" "}
              <strong style={strong}>{fmt(weeksRemaining)}</strong>.
            </Text>

            <table style={statsTable} cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={statCell}>
                    <Text style={statLabel}>Anos vividos</Text>
                    <Text style={statValue}>{fmt(stats.yearsLived)}</Text>
                  </td>
                  <td style={statCell}>
                    <Text style={statLabel}>Anos restantes</Text>
                    <Text style={statValue}>{fmt(stats.yearsRemaining)}</Text>
                  </td>
                </tr>
                <tr>
                  <td style={statCell}>
                    <Text style={statLabel}>Dias restantes</Text>
                    <Text style={statValue}>{fmt(stats.daysRemaining)}</Text>
                  </td>
                  <td style={statCell}>
                    <Text style={statLabel}>Percentual vivido</Text>
                    <Text style={statValue}>
                      {stats.percentLived.toFixed(1)}%
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={quoteText}>&ldquo;{quote.text}&rdquo;</Text>
            <Text style={quoteAuthor}>— {quote.author}</Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Link href={appUrl} style={link}>
              Visualizar no site
            </Link>
          </Section>

          <Text style={footer}>
            Você recebe este email porque se inscreveu em{" "}
            <Link href={appUrl} style={footerLink}>
              {appUrl.replace(/^https?:\/\//, "")}
            </Link>
            .{" "}
            <Link href={editUrl} style={footerLink}>
              Editar preferências
            </Link>
            {" · "}
            <Link href={unsubscribeUrl} style={footerLink}>
              Cancelar lembretes
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

WeeklyEmail.PreviewProps = {
  currentWeek: 1872,
  totalWeeks: 4160,
  appUrl: "https://example.com",
  unsubscribeUrl: "https://example.com/api/unsubscribe?token=preview",
  editUrl: "https://example.com/edit?token=preview",
  stats: {
    yearsLived: 35,
    yearsRemaining: 45,
    weeksLived: 1872,
    weeksRemaining: 2288,
    daysRemaining: 16425,
    percentLived: 45.0,
    totalWeeks: 4160,
  },
  quote: {
    text: "Não é que tenhamos pouco tempo, mas que perdemos muito.",
    author: "Sêneca",
  },
} satisfies Props;

export default WeeklyEmail;

const body: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily:
    "'Cormorant Garamond', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "48px 24px",
};

const title: React.CSSProperties = {
  fontSize: "40px",
  fontWeight: 300,
  letterSpacing: "-0.02em",
  color: "#111111",
  margin: 0,
};

const subtitle: React.CSSProperties = {
  fontSize: "16px",
  fontStyle: "italic",
  color: "#6b7280",
  marginTop: 4,
  marginBottom: 32,
};

const section: React.CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  paddingTop: 24,
};

const sans: React.CSSProperties = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const big: React.CSSProperties = {
  ...sans,
  fontSize: "18px",
  lineHeight: "28px",
  color: "#111111",
  margin: "0 0 12px 0",
};

const paragraph: React.CSSProperties = {
  ...sans,
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 24px 0",
};

const strong: React.CSSProperties = {
  color: "#111111",
  fontWeight: 600,
};

const statsTable: React.CSSProperties = {
  width: "100%",
  marginTop: 16,
};

const statCell: React.CSSProperties = {
  padding: "12px 0",
  width: "50%",
  verticalAlign: "top",
};

const statLabel: React.CSSProperties = {
  ...sans,
  fontSize: "11px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#6b7280",
  margin: 0,
};

const statValue: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 300,
  color: "#111111",
  margin: "4px 0 0 0",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const quoteText: React.CSSProperties = {
  fontSize: "22px",
  lineHeight: "30px",
  fontStyle: "italic",
  color: "#1f2937",
  margin: "0 0 8px 0",
};

const quoteAuthor: React.CSSProperties = {
  fontStyle: "italic",
  fontSize: "14px",
  color: "#6b7280",
  margin: 0,
};

const link: React.CSSProperties = {
  ...sans,
  fontSize: "13px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#111111",
  textDecoration: "none",
  borderBottom: "1px solid #111111",
  paddingBottom: 2,
};

const footer: React.CSSProperties = {
  ...sans,
  fontSize: "12px",
  color: "#9ca3af",
  marginTop: 48,
  borderTop: "1px solid #e5e7eb",
  paddingTop: 16,
};

const footerLink: React.CSSProperties = {
  color: "#6b7280",
  textDecoration: "underline",
};
