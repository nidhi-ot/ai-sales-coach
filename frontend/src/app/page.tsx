import Link from "next/link";

const highlights = [
  {
    title: "Realistic AI buyer personas",
    description:
      "Practice with customers who ask practical questions, raise objections, and respond to what the rep actually says.",
  },
  {
    title: "Instant scorecards",
    description:
      "Review rapport, discovery, objection handling, closing, and framework-specific feedback after each practice call.",
  },
  {
    title: "Progress tracking",
    description:
      "Use session history and score trends to focus the next practice call on the skill that needs the most work.",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose the practice setup",
    description:
      "Select the scenario, customer context, sales framework, and focus area before the call begins.",
  },
  {
    number: "02",
    title: "Speak with the AI customer",
    description:
      "Run a live voice call with a realistic buyer persona and practice handling real objections out loud.",
  },
  {
    number: "03",
    title: "Review and improve",
    description:
      "Use the scorecard and session history to understand what worked and what to practice next.",
  },
];

const benefits = [
  {
    title: "Safer practice before real calls",
    description:
      "Reps can rehearse difficult conversations before speaking with live prospects or customers.",
  },
  {
    title: "Consistent coaching language",
    description:
      "Managers and reps can discuss performance using the same scorecard categories and sales framework.",
  },
  {
    title: "Built for real service conversations",
    description:
      "The product can support practical customer contexts like BRFs, property owners, and cleaning service buyers.",
  },
];

const faqs = [
  {
    question: "Who is AI Sales Coach for?",
    answer:
      "It is for sales reps, managers, and teams who want a repeatable way to practice calls and improve over time.",
  },
  {
    question: "What happens after a practice call?",
    answer:
      "The session is saved, transcripts are captured, and a scorecard shows strengths, improvement areas, and next focus areas.",
  },
  {
    question: "Can the AI customer match our business context?",
    answer:
      "Yes. The practice setup can use business context, scenario, sales framework, and focus area to shape the AI buyer.",
  },
];

const stats = [
  { value: "Live", label: "voice practice with AI buyers" },
  { value: "Instant", label: "scorecards after calls" },
  { value: "Tracked", label: "progress across sessions" },
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
            <Link href="/login" style={ghostButtonStyle}>
              Log in
            </Link>
            <Link href="/register" style={primaryButtonStyle}>
              Create account
            </Link>
          </nav>
        </header>

        <section style={heroSectionStyle}>
          <span style={pillStyle}>
            AI-powered sales practice for real buyer conversations
          </span>

          <h1 style={titleStyle}>Practice sales calls before they count.</h1>

          <p style={leadStyle}>
            Train with realistic AI buyer personas, handle objections out loud,
            and review instant scorecards that show what to improve next.
          </p>

          <div style={heroActionsStyle}>
            <Link href="/register" style={primaryButtonLargeStyle}>
              Start practicing
            </Link>
            <Link href="/login" style={secondaryButtonLargeStyle}>
              Log in
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
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <p style={sectionKickerStyle}>Product overview</p>
            <h2 style={sectionTitleStyle}>
              A focused practice loop for better sales conversations.
            </h2>
          </div>

          <div style={overviewCardStyle}>
            <p style={overviewTextStyle}>
              AI Sales Coach helps reps prepare for customer conversations by
              turning practice into a repeatable workflow: choose a scenario,
              speak with a realistic AI buyer, review the scorecard, and use the
              next session to improve the weakest skill.
            </p>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <p style={sectionKickerStyle}>Key features</p>
            <h2 style={sectionTitleStyle}>
              Everything reps need to practice with purpose.
            </h2>
          </div>

          <div style={cardsGridStyle}>
            {highlights.map((item) => (
              <article key={item.title} style={featureCardStyle}>
                <h3 style={featureTitleStyle}>{item.title}</h3>
                <p style={featureTextStyle}>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

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

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <p style={sectionKickerStyle}>Benefits for sales teams</p>
            <h2 style={sectionTitleStyle}>
              Practice becomes repeatable, measurable, and easier to coach.
            </h2>
          </div>

          <div style={cardsGridStyle}>
            {benefits.map((item) => (
              <article key={item.title} style={featureCardStyle}>
                <h3 style={featureTitleStyle}>{item.title}</h3>
                <p style={featureTextStyle}>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <p style={sectionKickerStyle}>FAQ</p>
            <h2 style={sectionTitleStyle}>Common questions before the first practice call.</h2>
          </div>

          <div style={faqListStyle}>
            {faqs.map((item) => (
              <article key={item.question} style={faqItemStyle}>
                <h3 style={faqQuestionStyle}>{item.question}</h3>
                <p style={faqAnswerStyle}>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" style={contactSectionStyle}>
          <div style={contactCardStyle}>
            <div>
              <p style={sectionKickerStyle}>Contact Support</p>
              <h2 style={contactTitleStyle}>
                Need assistance with AI Sales Coach?
              </h2>
              <p style={contactTextStyle}>
                Our team is ready to help with technical issues, account questions, practice sessions, scorecards, and general product support. Send us a message and we'll respond as soon as possible.
              </p>
            </div>

            <form
              action="mailto:hello@aisalescoach.app"
              method="post"
              encType="text/plain"
              style={contactFormStyle}
            >
              <div style={contactFormRowStyle}>
                <label style={contactLabelStyle}>
                  Your name
                  <input name="name" style={contactInputStyle} />
                </label>

                <label style={contactLabelStyle}>
                  Work email
                  <input name="email" type="email" style={contactInputStyle} />
                </label>
              </div>

              <label style={contactLabelStyle}>
                Company
                <input name="company" style={contactInputStyle} />
              </label>

              <label style={contactLabelStyle}>
                What can we help with?
                <textarea name="message" rows={5} style={contactTextareaStyle} />
              </label>

              <div style={contactActionsStyle}>
                <button type="submit" style={contactSubmitButtonStyle}>
                  Send
                </button>
                <Link href="/login" style={secondaryButtonLargeStyle}>
                  Existing user? Log in
                </Link>
              </div>
            </form>
          </div>
        </section>
        <footer style={footerStyle}>
          <div style={footerContentStyle}>
            <p style={footerLogoStyle}>AI Sales Coach</p>

            <p style={footerDescriptionStyle}>
              AI-powered sales practice that helps reps rehearse realistic buyer
              conversations, review scorecards, and improve one call at a time.
            </p>

            <div style={footerContactStyle}>
              <p style={footerColumnTitleStyle}>contact</p>

              <Link href="#contact" style={footerLargeLinkStyle}>
                Get in touch
              </Link>

              <Link href="/login" style={footerLargeLinkStyle}>
                Existing user? Log in →
              </Link>
            </div>

            <div style={footerBottomStyle}>
              © 2026 AI Sales Coach
            </div>
          </div>
        </footer>
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

const heroSectionStyle = {
  display: "grid",
  gap: "20px",
  padding: "56px 0 44px",
  textAlign: "left" as const,
  justifyItems: "start",
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
  maxWidth: "14ch",
};

const leadStyle = {
  margin: 0,
  maxWidth: "68ch",
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

const overviewCardStyle = {
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderRadius: "24px",
  padding: "28px",
  boxShadow: "0 18px 44px rgba(15, 23, 42, 0.07)",
};

const overviewTextStyle = {
  margin: 0,
  maxWidth: "78ch",
  color: "#475467",
  fontSize: "18px",
  lineHeight: 1.75,
};

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px",
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

const contactFormStyle = {
  display: "grid",
  gap: "18px",
  minWidth: "320px",
  flex: "1 1 520px",
};

const contactFormRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const contactLabelStyle = {
  display: "grid",
  gap: "8px",
  color: "#344054",
  fontSize: "14px",
  fontWeight: 700,
};

const contactInputStyle = {
  width: "100%",
  minHeight: "48px",
  borderRadius: "14px",
  boxSizing: "border-box" as const,
  border: "1px solid rgba(148,163,184,0.55)",
  background: "rgba(255,255,255,0.86)",
  padding: "0 14px",
  color: "#101828",
  font: "inherit",
  outlineColor: "#006b4f",
};

const contactTextareaStyle = {
  ...contactInputStyle,
  minHeight: "140px",
  padding: "14px",
  resize: "vertical" as const,
};

const contactSubmitButtonStyle = {
  ...primaryButtonLargeStyle,
  border: "none",
  cursor: "pointer",
  font: "inherit",
};

const faqListStyle = {
  display: "grid",
  gap: "12px",
};

const faqItemStyle = {
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderRadius: "22px",
  padding: "22px",
};

const faqQuestionStyle = {
  margin: 0,
  color: "#101828",
  fontSize: "18px",
};

const faqAnswerStyle = {
  margin: "8px 0 0",
  color: "#667085",
  lineHeight: 1.65,
};

const footerStyle = {
  marginTop: "36px",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  marginBottom: "-48px",
  background: "linear-gradient(180deg, #101a4a 0%, #0b143b 100%)",
  color: "#f8fbf9",
  borderTop: "1px solid rgba(248,251,249,0.16)",
};

const footerContentStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "92px 24px 42px",
};

const footerLogoStyle = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 900,
};

const footerDescriptionStyle = {
  margin: "42px 0 0",
  maxWidth: "680px",
  color: "rgba(248,251,249,0.72)",
  fontFamily: "Georgia, serif",
  fontStyle: "italic" as const,
  fontSize: "22px",
  lineHeight: 1.75,
};

const footerContactStyle = {
  marginTop: "62px",
  display: "grid",
  gap: "18px",
  justifyItems: "start",
};

const footerColumnTitleStyle = {
  margin: 0,
  color: "rgba(248,251,249,0.72)",
  fontFamily: "Georgia, serif",
  fontStyle: "italic" as const,
  fontSize: "18px",
  letterSpacing: "0.04em",
};

const footerLargeLinkStyle = {
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "22px",
  fontWeight: 700,
};

const footerBottomStyle = {
  marginTop: "78px",
  paddingTop: "34px",
  borderTop: "1px solid rgba(248,251,249,0.16)",
  color: "rgba(248,251,249,0.62)",
  fontSize: "18px",
};