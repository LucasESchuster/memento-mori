import {
  Body,
  Column,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
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
  const pct = Math.max(0, Math.min(100, stats.percentLived));
  const pctFilled = pct.toFixed(2);
  const pctEmpty = (100 - pct).toFixed(2);
  const domain = appUrl.replace(/^https?:\/\//, "");

  return (
    <Html lang="pt-BR">
      <Head>
        <Font
          fontFamily="Cormorant Garamond"
          fallbackFontFamily={["Georgia", "Times New Roman", "serif"]}
          webFont={{
            url: "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjornFLsS6V7w.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="IBM Plex Mono"
          fallbackFontFamily={["monospace"]}
          webFont={{
            url: "https://fonts.gstatic.com/s/ibmplexmono/v19/-F63fjptAgt5VM-kVkqdyU8n1iIq131nj-otFQ.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>
        {`Semana ${fmt(currentWeek)} de ${fmt(totalWeeks)} — ${stats.percentLived.toFixed(1)}% vivido.`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* masthead */}
          <Section style={masthead}>
            <Row>
              <Column style={mastheadMetaLeft}>
                Memento Mori · No. {fmt(currentWeek)}
              </Column>
            </Row>
            <Text style={title}>
              Memento
              <br />
              <em style={titleEm}>mori.</em>
            </Text>
            <Text style={subtitle}>Lembra-te de que és mortal.</Text>
          </Section>

          {/* hero — week number */}
          <Section style={hero}>
            <Text style={heroLabel}>Nesta semana —</Text>
            <Row>
              <Column style={heroNumberCell}>{fmt(currentWeek)}</Column>
              <Column style={heroNumberSideCell}>
                <div style={heroNumberWord}>semana</div>
                <div style={heroNumberSub}>completa da sua vida</div>
              </Column>
            </Row>
            <Text style={heroParagraph}>
              De aproximadamente{" "}
              <span style={inkInline}>{fmt(totalWeeks)}</span> semanas que
              compõem a sua expectativa, restam-lhe cerca de{" "}
              <span style={accentInline}>{fmt(weeksRemaining)}</span>.
            </Text>
          </Section>

          {/* stat grid */}
          <Section style={statsSection}>
            <Row>
              <Column style={statCell}>
                <Text style={statLabel}>Anos vividos</Text>
                <Text style={statValue}>{fmt(stats.yearsLived)}</Text>
              </Column>
              <Column style={statCell}>
                <Text style={statLabel}>Anos restantes</Text>
                <Text style={statValue}>{fmt(stats.yearsRemaining)}</Text>
              </Column>
            </Row>
            <Row>
              <Column style={statCell}>
                <Text style={statLabel}>Dias restantes</Text>
                <Text style={statValue}>{fmt(stats.daysRemaining)}</Text>
              </Column>
              <Column style={statCell}>
                <Text style={statLabel}>Percentual vivido</Text>
                <Text style={statValueAccent}>
                  {stats.percentLived.toFixed(1)}%
                </Text>
              </Column>
            </Row>
          </Section>

          {/* progress bar — table-based, no absolute positioning */}
          <Section style={progressSection}>
            <table
              cellPadding={0}
              cellSpacing={0}
              style={progressTable}
              width="100%"
            >
              <tbody>
                <tr>
                  <td style={progressFilled} width={`${pctFilled}%`}>
                    &nbsp;
                  </td>
                  <td style={progressMarker}>&nbsp;</td>
                  <td style={progressEmpty} width={`${pctEmpty}%`}>
                    &nbsp;
                  </td>
                </tr>
              </tbody>
            </table>
            <Row style={progressLabelsRow}>
              <Column style={progressLabelLeft}>nascimento</Column>
              <Column style={progressLabelCenter}>◦ você está aqui</Column>
              <Column style={progressLabelRight}>fim provável</Column>
            </Row>
          </Section>

          {/* meditation */}
          <Section style={meditationSection}>
            <Text style={meditationKicker}>— Meditação da semana</Text>
            <Text style={quoteTextStyle}>&ldquo;{quote.text}&rdquo;</Text>
            <Text style={quoteAuthorStyle}>— {quote.author}</Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={appUrl} style={ctaButton}>
              Visualizar no site &nbsp;→
            </Link>
            <Text style={ctaCaption}>
              veja a sua vida inteira numa página · {fmt(totalWeeks)} quadrados
            </Text>
          </Section>

          {/* footer */}
          <Section style={footerSection}>
            <Text style={footerTagline}>
              tempus fugit, <em style={accentInline}>memento mori</em>.
            </Text>
            <Hr style={footerHr} />
            <Text style={footerText}>
              Você recebe este email porque se inscreveu em{" "}
              <Link href={appUrl} style={footerLink}>
                {domain}
              </Link>
              .
            </Text>
            <Text style={footerLinksRow}>
              <Link href={editUrl} style={footerLink}>
                Editar preferências
              </Link>
              {"   ·   "}
              <Link href={unsubscribeUrl} style={footerLink}>
                Cancelar lembretes
              </Link>
            </Text>
            <Text style={footerCopyright}>© Lucas E. Schuster · MMXXVI</Text>
          </Section>
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

/* ----------------------------------------------------------------------------
 * Styles — "stoic press" palette from the redesign mock.
 * Palette: paper #efe9dd, ink #1a1613, terracotta #a04e2a, muted #6b6259.
 * All layout is table-based (Row/Column) for Outlook/Gmail compatibility.
 * -------------------------------------------------------------------------- */

const serif =
  "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const mono = "'IBM Plex Mono', 'Courier New', monospace";

const ink = "#1a1613";
const accent = "#a04e2a";
const muted = "#6b6259";
const faint = "#8a8175";

const body: React.CSSProperties = {
  backgroundColor: "#d8d2c4",
  fontFamily: serif,
  margin: 0,
  padding: "40px 12px 64px",
};

const container: React.CSSProperties = {
  maxWidth: "640px",
  margin: "0 auto",
  backgroundColor: "#efe9dd",
  border: "1px solid #c9c0ae",
};

const inkInline: React.CSSProperties = { color: ink, fontStyle: "normal" };
const accentInline: React.CSSProperties = {
  color: accent,
  fontStyle: "normal",
};

/* masthead */
const masthead: React.CSSProperties = {
  padding: "40px 48px 28px",
  borderBottom: "1px solid #d4cab5",
};

const mastheadMetaLeft: React.CSSProperties = {
  fontFamily: mono,
  fontSize: "9px",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: accent,
  textAlign: "left",
};

const title: React.CSSProperties = {
  fontFamily: serif,
  fontWeight: 400,
  fontSize: "52px",
  lineHeight: "0.95",
  letterSpacing: "-0.03em",
  color: ink,
  margin: "32px 0 10px",
};

const titleEm: React.CSSProperties = {
  fontWeight: 300,
  color: "#5c5449",
};

const subtitle: React.CSSProperties = {
  fontFamily: serif,
  fontStyle: "italic",
  fontWeight: 300,
  fontSize: "18px",
  lineHeight: "1.4",
  color: muted,
  margin: 0,
};

/* hero */
const hero: React.CSSProperties = {
  padding: "40px 48px 8px",
};

const heroLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: "10px",
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  color: accent,
  margin: "0 0 12px",
};

const heroNumberCell: React.CSSProperties = {
  fontFamily: serif,
  fontWeight: 400,
  fontSize: "104px",
  lineHeight: "0.85",
  letterSpacing: "-0.04em",
  color: ink,
  width: "1%",
  whiteSpace: "nowrap",
  verticalAlign: "bottom",
};

const heroNumberSideCell: React.CSSProperties = {
  paddingLeft: "20px",
  verticalAlign: "bottom",
};

const heroNumberWord: React.CSSProperties = {
  fontFamily: serif,
  fontStyle: "italic",
  fontSize: "26px",
  color: accent,
  lineHeight: "1",
};

const heroNumberSub: React.CSSProperties = {
  fontFamily: mono,
  fontSize: "9px",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: muted,
  marginTop: "8px",
};

const heroParagraph: React.CSSProperties = {
  fontFamily: serif,
  fontStyle: "italic",
  fontWeight: 300,
  fontSize: "19px",
  lineHeight: "1.55",
  color: "#5c5449",
  margin: "20px 0 0",
};

/* stat grid */
const statsSection: React.CSSProperties = {
  padding: "24px 48px 8px",
};

const statCell: React.CSSProperties = {
  width: "50%",
  padding: "20px 0",
  verticalAlign: "top",
  borderTop: "1px solid #d4cab5",
};

const statLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: "9px",
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  color: muted,
  margin: "0 0 8px",
};

const statValue: React.CSSProperties = {
  fontFamily: serif,
  fontSize: "42px",
  fontWeight: 400,
  lineHeight: "1",
  color: ink,
  margin: 0,
};

const statValueAccent: React.CSSProperties = { ...statValue, color: accent };

/* progress bar */
const progressSection: React.CSSProperties = {
  padding: "24px 48px 32px",
};

const progressTable: React.CSSProperties = {
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const progressFilled: React.CSSProperties = {
  height: "2px",
  backgroundColor: ink,
  fontSize: "1px",
  lineHeight: "2px",
};

const progressMarker: React.CSSProperties = {
  width: "8px",
  height: "8px",
  backgroundColor: accent,
  fontSize: "1px",
  lineHeight: "8px",
};

const progressEmpty: React.CSSProperties = {
  height: "1px",
  backgroundColor: "#d4cab5",
  fontSize: "1px",
  lineHeight: "1px",
};

const progressLabelsRow: React.CSSProperties = {
  marginTop: "10px",
};

const progressLabelBase: React.CSSProperties = {
  fontFamily: mono,
  fontSize: "8px",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "#a89e88",
};

const progressLabelLeft: React.CSSProperties = {
  ...progressLabelBase,
  textAlign: "left",
};
const progressLabelCenter: React.CSSProperties = {
  ...progressLabelBase,
  textAlign: "center",
  color: accent,
};
const progressLabelRight: React.CSSProperties = {
  ...progressLabelBase,
  textAlign: "right",
};

/* meditation */
const meditationSection: React.CSSProperties = {
  padding: "8px 48px 40px",
  borderTop: "1px solid #d4cab5",
};

const meditationKicker: React.CSSProperties = {
  fontFamily: mono,
  fontSize: "9px",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: accent,
  margin: "24px 0 20px",
};

const quoteTextStyle: React.CSSProperties = {
  fontFamily: serif,
  fontStyle: "italic",
  fontWeight: 300,
  fontSize: "29px",
  lineHeight: "1.25",
  letterSpacing: "-0.01em",
  color: ink,
  margin: "0 0 16px",
};

const quoteAuthorStyle: React.CSSProperties = {
  fontFamily: serif,
  fontStyle: "italic",
  fontSize: "15px",
  color: muted,
  margin: 0,
};

/* CTA */
const ctaSection: React.CSSProperties = {
  padding: "0 48px 40px",
};

const ctaButton: React.CSSProperties = {
  display: "block",
  padding: "20px",
  backgroundColor: ink,
  color: "#efe9dd",
  textAlign: "center",
  fontFamily: mono,
  fontSize: "10px",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  textDecoration: "none",
};

const ctaCaption: React.CSSProperties = {
  marginTop: "14px",
  textAlign: "center",
  fontFamily: serif,
  fontStyle: "italic",
  fontSize: "15px",
  color: faint,
};

/* footer */
const footerSection: React.CSSProperties = {
  padding: "32px 48px 40px",
  backgroundColor: "#e6dfd0",
  borderTop: "1px solid #d4cab5",
};

const footerTagline: React.CSSProperties = {
  fontFamily: serif,
  fontStyle: "italic",
  fontSize: "16px",
  color: muted,
  textAlign: "center",
  margin: "0 0 20px",
};

const footerHr: React.CSSProperties = {
  borderColor: "#d4cab5",
  margin: "0 0 20px",
};

const footerText: React.CSSProperties = {
  fontFamily: mono,
  fontSize: "9px",
  letterSpacing: "0.16em",
  lineHeight: "1.9",
  color: faint,
  textAlign: "center",
  margin: 0,
};

const footerLinksRow: React.CSSProperties = {
  ...footerText,
  margin: "14px 0 0",
};

const footerLink: React.CSSProperties = {
  color: muted,
  textDecoration: "underline",
};

const footerCopyright: React.CSSProperties = {
  ...footerText,
  color: "#a89e88",
  margin: "20px 0 0",
};
