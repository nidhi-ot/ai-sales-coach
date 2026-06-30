import Link from "next/link";

const highlights = [
  {
    title: "Practice the hard conversations",
    description:
      "Run realistic role-plays for discovery, objections, demos, and closing practice.",
  },
  {
    title: "Turn every call into feedback",
    description:
      "Use scorecards and session history to see what worked and where to improve.",
  },
  {
    title: "Keep reps moving forward",
    description:
      "Track progress over time so the next session always has a clearer focus.",
  },
];

const steps = [
  {
    number: "01",
    title: "Log in or create an account",
    description:
      "Get into the app quickly and move straight into your practice workflow.",
  },
  {
    number: "02",
    title: "Choose a scenario and run a call",
    description:
      "Pick a practice situation that matches what the team needs this week.",
  },
  {
    number: "03",
    title: "Review feedback and try again",
    description:
      "Look at scorecards, history, and coaching notes before the next session.",
  },
];

const stats = [
  { value: "Live", label: "buyer-style practice sessions" },
  { value: "Fast", label: "feedback through scorecards" },
  { value: "Clear", label: "next steps after every call" },
];

export default function HomePage() {
  return (
    <main style={pageStyle}>
      <div style={backgroundGlowLeft} />
      <div style={backgroundGlowRight} />

      <section style={shellStyle}>
        <header style={headerStyle}>
          <div style={brandWrapStyle}>
            <img src="/logo.png" alt="AI Sales Coach" style={logoStyle} />
            <div>
              <p style={eyebrowStyle}>AI Sales Coach</p>
              <p style={brandCopyStyle}>Practice calls. Get coaching. Improve faster.</p>
            </div>
          </div>

          <nav style={headerActionsStyle} aria-label="Homepage actions">
            <Link href="#contact" style={ghostButtonStyle}>
              Contact Us
            </Link>
            <Link href="/login" style={primaryButtonStyle}>
              Login
            </Link>
          </nav>
        </header>

        <div style={heroGridStyle}>
          <div style={heroCopyStyle}>
            <span style={pillStyle}>Built for sales reps and enablement teams</span>
            <h1 style={titleStyle}>
              A lighter way to practice
              <br />
              real sales conversations.
            </h1>
            <p style={leadStyle}>
              AI Sales Coach gives your team a simple place to rehearse calls,
              review scorecards, and keep each practice session focused on the
              next improvement.
            </p>

            <div style={heroActionsStyle}>
              <Link href="/login" style={primaryButtonLargeStyle}>
                Login to continue
              </Link>
              <Link href="#contact" style={secondaryButtonLargeStyle}>
                Contact Us
              </Link>
            </div>

            <div style={statsRowStyle}>
              {stats.map((stat) => (
                <div key={stat.label} style={statCardStyle}>
                  <div style={statValueStyle}>{stat.value}</div>
                  <p style={statLabelStyle}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <aside style={panelStyle}>
            <div style={panelInnerStyle}>
              <p style={panelKickerStyle}>Why teams use it</p>
              <h2 style={panelTitleStyle}>Simple enough for reps, useful enough for managers.</h2>
              <p style={panelTextStyle}>
                The experience is designed to stay lightweight on the front end
                while still capturing the details that matter after the call.
              </p>
            </div>

            <div style={cardGridStyle}>
              {highlights.map((item) => (
                <article key={item.title} style={featureCardStyle}>
                  <h3 style={featureTitleStyle}>{item.title}</h3>
                  <p style={featureTextStyle}>{item.description}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <p style={sectionKickerStyle}>How it works</p>
            <h2 style={sectionTitleStyle}>The workflow stays focused from start to finish.</h2>
          </div>

          <div style={stepsGridStyle}>
            {steps.map((step) => (
              <article key={step.number} style={stepCardStyle}>
                <span style={stepNumberStyle}>{step.number}</span>
                <h3 style={stepTitleStyle}>{step.title}</h3>
                <p style={stepTextStyle}>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" style={contactSectionStyle}>
          <div style={contactCardStyle}>
            <div>
              <p style={sectionKickerStyle}>Contact Us</p>
              <h2 style={contactTitleStyle}>Need help getting started?</h2>
              <p style={contactTextStyle}>
                Use the login page to enter the app, or share this page with your
                team if you want a cleaner entry point before sign-in.
              </p>
            </div>

            <div style={contactActionsStyle}>
              <Link href="/login" style={primaryButtonLargeStyle}>
                Login
              </Link>
              <Link href="/register" style={secondaryButtonLargeStyle}>
                Create account
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  position: "relative" as const,
  overflow: "hidden",
  background: "linear-gradient(180deg, #f8fbf9 0%, #eef6f1 100%)",
  color: "#0f1728",
};

const backgroundGlowLeft = {
  position: "absolute" as const,
  left: "-120px",
  top: "-120px",
  width: "340px",
  height: "340px",
  borderRadius: "999px",
  background: "radial-gradient(circle, rgba(0,107,79,0.14) 0%, rgba(0,107,79,0) 70%)",
  filter: "blur(8px)",
};

const backgroundGlowRight = {
  position: "absolute" as const,
  right: "-140px",
  bottom: "-120px",
  width: "380px",
  height: "380px",
  borderRadius: "999px",
  background: "radial-gradient(circle, rgba(17,24,39,0.08) 0%, rgba(17,24,39,0) 70%)",
  filter: "blur(8px)",
};

const shellStyle = {
  position: "relative" as const,
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "28px 24px 48px",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap" as const,
  marginBottom: "28px",
};

const brandWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const logoStyle = {
  width: "52px",
  height: "52px",
  objectFit: "contain" as const,
};

const eyebrowStyle = {
  margin: 0,
  fontSize: "13px",
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "#006b4f",
};

const brandCopyStyle = {
  margin: "3px 0 0",
  fontSize: "14px",
  color: "#667085",
};

const headerActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const heroGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.12fr) minmax(320px, 0.88fr)",
  gap: "28px",
  alignItems: "start",
};

const heroCopyStyle = {
  padding: "24px 0",
};

const pillStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "#e7f4ef",
  color: "#006b4f",
  fontWeight: 700,
  fontSize: "13px",
};

const titleStyle = {
  margin: "18px 0 16px",
  fontSize: "clamp(42px, 5vw, 68px)",
  lineHeight: 1.02,
  letterSpacing: "-0.04em",
  maxWidth: "12ch",
};

const leadStyle = {
  margin: 0,
  maxWidth: "60ch",
  fontSize: "18px",
  lineHeight: 1.7,
  color: "#4b5563",
};

const heroActionsStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
  marginTop: "28px",
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "44px",
  padding: "0 18px",
  borderRadius: "999px",
  background: "#006b4f",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
  boxShadow: "0 14px 30px rgba(0,107,79,0.18)",
};

const primaryButtonLargeStyle = {
  ...primaryButtonStyle,
  minHeight: "52px",
  padding: "0 24px",
};

const ghostButtonStyle = {
  ...primaryButtonStyle,
  background: "rgba(255,255,255,0.82)",
  color: "#0f1728",
  boxShadow: "inset 0 0 0 1px rgba(148,163,184,0.35)",
};

const secondaryButtonLargeStyle = {
  ...ghostButtonStyle,
  minHeight: "52px",
  padding: "0 24px",
};

const statsRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
  marginTop: "28px",
};

const statCardStyle = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderRadius: "20px",
  padding: "18px",
  backdropFilter: "blur(10px)",
};

const statValueStyle = {
  fontSize: "28px",
  fontWeight: 900,
  lineHeight: 1,
  color: "#006b4f",
};

const statLabelStyle = {
  margin: "10px 0 0",
  fontSize: "14px",
  lineHeight: 1.5,
  color: "#475467",
};

const panelStyle = {
  display: "grid",
  gap: "16px",
};

const panelInnerStyle = {
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderRadius: "28px",
  padding: "28px",
  boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
};

const panelKickerStyle = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#006b4f",
};

const panelTitleStyle = {
  margin: "10px 0 12px",
  fontSize: "26px",
  lineHeight: 1.2,
};

const panelTextStyle = {
  margin: 0,
  color: "#667085",
  lineHeight: 1.7,
};

const cardGridStyle = {
  display: "grid",
  gap: "12px",
};

const featureCardStyle = {
  background: "rgba(255,255,255,0.88)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderRadius: "22px",
  padding: "20px",
};

const featureTitleStyle = {
  margin: 0,
  fontSize: "18px",
  color: "#101828",
};

const featureTextStyle = {
  margin: "8px 0 0",
  color: "#667085",
  lineHeight: 1.6,
};

const sectionStyle = {
  marginTop: "28px",
};

const sectionHeaderStyle = {
  marginBottom: "18px",
};

const sectionKickerStyle = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#006b4f",
};

const sectionTitleStyle = {
  margin: "8px 0 0",
  fontSize: "clamp(28px, 3vw, 40px)",
  lineHeight: 1.15,
  maxWidth: "16ch",
};

const stepsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px",
};

const stepCardStyle = {
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderRadius: "22px",
  padding: "22px",
};

const stepNumberStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "44px",
  height: "44px",
  borderRadius: "14px",
  background: "#e7f4ef",
  color: "#006b4f",
  fontWeight: 900,
  fontSize: "14px",
};

const stepTitleStyle = {
  margin: "16px 0 8px",
  fontSize: "18px",
  color: "#101828",
};

const stepTextStyle = {
  margin: 0,
  color: "#667085",
  lineHeight: 1.65,
};

const contactSectionStyle = {
  marginTop: "28px",
};

const contactCardStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  padding: "28px",
  borderRadius: "28px",
  background: "linear-gradient(135deg, rgba(0,107,79,0.08) 0%, rgba(255,255,255,0.86) 100%)",
  border: "1px solid rgba(226,232,240,0.9)",
  boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
  flexWrap: "wrap" as const,
};

const contactTitleStyle = {
  margin: "10px 0 10px",
  fontSize: "28px",
  lineHeight: 1.2,
};

const contactTextStyle = {
  margin: 0,
  maxWidth: "60ch",
  color: "#667085",
  lineHeight: 1.7,
};

const contactActionsStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
};
