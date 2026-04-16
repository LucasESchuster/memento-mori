import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  confirmUrl: string;
};

export function ConfirmEmail({ confirmUrl }: Props) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Confirme sua inscrição nos lembretes semanais</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={title}>Memento Mori</Text>
          <Text style={subtitle}>lembretes semanais</Text>

          <Section style={section}>
            <Text style={paragraph}>
              Você pediu para receber um lembrete a cada semana de vida
              completada. Confirme clicando abaixo.
            </Text>
            <Button href={confirmUrl} style={button}>
              Confirmar inscrição
            </Button>
            <Text style={fine}>
              Se não foi você, ignore este email — nenhum lembrete será enviado.
            </Text>
          </Section>

          <Text style={footer}>
            tempus fugit, memento mori.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

ConfirmEmail.PreviewProps = {
  confirmUrl: "https://example.com/api/confirm?token=preview",
} satisfies Props;

export default ConfirmEmail;

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

const paragraph: React.CSSProperties = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: "15px",
  lineHeight: "24px",
  color: "#111111",
  margin: "0 0 24px 0",
};

const button: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#111111",
  color: "#ffffff",
  padding: "12px 24px",
  textDecoration: "none",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: "13px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
};

const fine: React.CSSProperties = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: "13px",
  color: "#9ca3af",
  margin: "24px 0 0 0",
};

const footer: React.CSSProperties = {
  fontStyle: "italic",
  fontSize: "13px",
  color: "#9ca3af",
  marginTop: 48,
  borderTop: "1px solid #e5e7eb",
  paddingTop: 16,
};
