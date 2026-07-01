import Link from "next/link";

const partners = [
  "Optimal Trappstädning",
  "Fastighetsägarna",
  "Svenska Städföretagen",
  "Serviceföretagen",
  "Almega",
];

const steps = [
  {
    no: "1",
    title: "Choose a Scenario",
    text: "Pick a real sales situation based on our services.",
    icon: "👤",
  },
  {
    no: "2",
    title: "Talk to AI Customer",
    text: "Have a natural conversation with an AI customer.",
    icon: "🤖",
  },
  {
    no: "3",
    title: "Get Instant Feedback",
    text: "Receive AI feedback, tips and suggestions.",
    icon: "💬",
  },
  {
    no: "4",
    title: "Improve & Track",
    text: "See your progress and become a top performer.",
    icon: "📈",
  },
];

const benefits = [
  {
    title: "Built for Sales Reps",
    text: "Designed to help reps practice, improve and close more deals.",
    icon: "🛡️",
  },
  {
    title: "Based on Our Services",
    text: "Scenarios are based on cleaning, maintenance and property services.",
    icon: "🏢",
  },
  {
    title: "Practice Anytime",
    text: "No need to wait for a manager. Practice whenever you want.",
    icon: "🕒",
  },
  {
    title: "Secure & Private",
    text: "Your conversations and progress are 100% private.",
    icon: "🔒",
  },
];

export default function HomePage() {
  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div style={brandStyle}>
          <img src="/logo.png" alt="Optimal Trappstädning" style={logoStyle} />
          <div>
            <h1 style={brandTitle}>Optimal Trappstädning</h1>
            <p style={brandSub}>AI Sales Coach</p>
          </div>
        </div>

        <div style={headerButtons}>
          <Link href="/contact" style={contactButton}>
            ☎ Contact Us
          </Link>
          <Link href="/login" style={loginButton}>
            👤 Log in
          </Link>
        </div>
      </header>

      <section style={heroSection}>
        <div style={heroLeft}>
          <span style={pill}>✦ AI-Powered Sales Practice</span>

          <h2 style={heroTitle}>
            Practice Smarter.
            <br />
            <span style={green}>Perform Better</span>
            <br />
            in Real Calls.
          </h2>

          <p style={heroText}>
            Rehearse real sales conversations with AI customers based on Optimal
            Trappstädning&apos;s services. Get instant feedback, improve your
            skills, and feel confident before every live customer call.
          </p>

          <Link href="/login" style={startButton}>
            Start Practice →
          </Link>

          <div style={miniFeatures}>
            <MiniFeature icon="💬" title="Realistic AI Customers" text="Practice with AI customers that sound real." />
            <MiniFeature icon="💡" title="Instant Feedback" text="Get coaching tips and insights after each call." />
            <MiniFeature icon="📊" title="Track Improvement" text="See your progress over time and improve." />
            <MiniFeature icon="🏆" title="Build Confidence" text="Be fully prepared for every real call." />
          </div>
        </div>

        <div style={heroRight}>
          <div style={dashboardMockup}>
            <aside style={mockSidebar}>
              {["⌂", "💬", "📊", "🎯", "📘", "👤", "⚙"].map((i, idx) => (
                <div key={i} style={idx === 0 ? activeIcon : sideIcon}>
                  {i}
                </div>
              ))}
            </aside>

            <div style={mockContent}>
              <div style={mockHeader}>
                <div>
                  <h3 style={mockTitle}>AI Sales Coach 👋</h3>
                  <p style={muted}>Prepare for your next customer call.</p>
                </div>
                <span style={streak}>🔥 7 days</span>
              </div>

              <div style={mockGrid}>
                <div style={recommendCard}>
                  <div style={mockTopRow}>
                    <p style={label}>Recommended Practice</p>
                    <span style={smallBadge}>For You</span>
                  </div>
                  <h4 style={cardTitle}>Price Objection Handling</h4>
                  <p style={cardText}>
                    Practice responding when customers say the service is too
                    expensive.
                  </p>
                  <button style={smallButton}>Start Practice →</button>
                </div>

                <div style={progressCard}>
                  <p style={label}>Overall Progress</p>
                  <div style={circle}>78%</div>
                  <ul style={skillsList}>
                    <li>Discovery <b>90%</b></li>
                    <li>Value Proposition <b>80%</b></li>
                    <li>Objections <b>62%</b></li>
                    <li>Closing <b>78%</b></li>
                  </ul>
                </div>
              </div>

              <div style={mockGrid}>
                <div style={sessionsCard}>
                  <div style={mockTopRow}>
                    <h4 style={listTitle}>Recent Practice Sessions</h4>
                    <span style={greenSmall}>View all</span>
                  </div>
                  <Session title="Hot Call" date="May 31, 10:30 AM" score="82%" />
                  <Session title="Service Inquiry Call" date="May 30, 03:20 PM" score="88%" />
                  <Session title="Demo Call" date="May 29, 11:20 AM" score="75%" />
                  <Session title="Closing Practice" date="May 28, 09:15 AM" score="82%" />
                </div>

                <div style={tipCard}>
                  <h4 style={listTitle}>AI Coach Tip</h4>
                  <div style={robot}>🤖</div>
                  <p style={cardText}>
                    Try asking more open-ended questions to understand the
                    customer&apos;s real needs.
                  </p>
                  <span style={greenSmall}>See Example →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={partnersSection}>
        <p style={partnersTitle}>Trusted by property service companies in Sweden</p>
        <div style={partnersRow}>
          {partners.map((p, index) => (
            <div key={p} style={partnerItem}>
              <strong>{p}</strong>
              {index < partners.length - 1 && <span style={arrow}>›</span>}
            </div>
          ))}
        </div>
      </section>

      <section style={stepsSection}>
        <p style={sectionKicker}>HOW IT WORKS</p>
        <h2 style={sectionTitle}>
          4 simple steps to become a top-performing sales rep
        </h2>

        <div style={stepsRow}>
          {steps.map((step, index) => (
            <div key={step.no} style={stepWrap}>
              <article style={stepCard}>
                <span style={stepNumber}>{step.no}</span>
                <div style={stepIcon}>{step.icon}</div>
                <h3 style={stepHeading}>{step.title}</h3>
                <p style={stepText}>{step.text}</p>
              </article>
              {index < steps.length - 1 && <span style={stepArrow}>······›</span>}
            </div>
          ))}
        </div>
      </section>

      <section style={benefitsRow}>
        {benefits.map((b) => (
          <div key={b.title} style={benefitCard}>
            <div style={benefitIcon}>{b.icon}</div>
            <div>
              <h3 style={benefitTitle}>{b.title}</h3>
              <p style={benefitText}>{b.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section style={ctaSection} id="contact">
        <div style={robotBox}>🤖</div>
        <div>
          <h2 style={ctaTitle}>Ready to become a top-performing sales rep?</h2>
          <p style={ctaText}>
            Practice with AI customers, get feedback, and build confidence
            before real customer calls.
          </p>
          <Link href="/login" style={ctaButton}>
            Start Practice →
          </Link>
        </div>

        <div style={ratingBox}>
          <div style={stars}>★★★★★</div>
          <strong style={rating}>100%</strong>
          <p style={ctaText}>focused on practice and improvement</p>
        </div>
      </section>
    </main>
  );
}

function MiniFeature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div style={miniFeature}>
      <div style={miniIcon}>{icon}</div>
      <h3 style={miniTitle}>{title}</h3>
      <p style={miniText}>{text}</p>
    </div>
  );
}

function Session({
  title,
  date,
  score,
}: {
  title: string;
  date: string;
  score: string;
}) {
  return (
    <div style={sessionRow}>
      <div>
        <strong>{title}</strong>
        <p style={sessionDate}>{date}</p>
      </div>
      <span style={sessionScore}>{score}</span>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 10% 20%, rgba(0,112,79,0.08), transparent 25%), linear-gradient(180deg, #f9fcfa 0%, #eef8f2 100%)",
  color: "#101828",
  padding: "28px 60px 60px",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const headerStyle = {
  maxWidth: "1500px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const logoStyle = {
  width: "64px",
  height: "64px",
  objectFit: "contain" as const,
};

const brandTitle = {
  margin: 0,
  fontSize: "26px",
  fontWeight: 900,
};

const brandSub = {
  margin: "2px 0 0",
  color: "#00704f",
  fontSize: "18px",
  fontWeight: 800,
};

const headerButtons = {
  display: "flex",
  gap: "14px",
};

const contactButton = {
  padding: "14px 24px",
  borderRadius: "14px",
  border: "1px solid #00704f",
  background: "#fff",
  color: "#064e3b",
  fontWeight: 800,
  textDecoration: "none",
};

const loginButton = {
  padding: "14px 24px",
  borderRadius: "14px",
  background: "#00704f",
  color: "#fff",
  fontWeight: 800,
  textDecoration: "none",
  boxShadow: "0 16px 36px rgba(0,112,79,0.22)",
};

const heroSection = {
  maxWidth: "1500px",
  margin: "70px auto 0",
  display: "grid",
  gridTemplateColumns: "0.9fr 1.15fr",
  gap: "70px",
  alignItems: "center",
};

const heroLeft = {};

const pill = {
  display: "inline-block",
  padding: "10px 16px",
  borderRadius: "999px",
  background: "#dff5ea",
  color: "#00704f",
  fontSize: "14px",
  fontWeight: 900,
};

const heroTitle = {
  margin: "24px 0",
  fontSize: "66px",
  lineHeight: 1.05,
  letterSpacing: "-0.05em",
  fontWeight: 950,
};

const green = {
  color: "#00704f",
};

const heroText = {
  maxWidth: "660px",
  fontSize: "20px",
  lineHeight: 1.75,
  color: "#475467",
};

const startButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "22px",
  padding: "18px 34px",
  borderRadius: "16px",
  background: "#00704f",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
  boxShadow: "0 20px 44px rgba(0,112,79,0.24)",
};

const miniFeatures = {
  marginTop: "45px",
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "24px",
};

const miniFeature = {};

const miniIcon = {
  width: "54px",
  height: "54px",
  borderRadius: "18px",
  background: "#e0f6ea",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
};

const miniTitle = {
  fontSize: "16px",
  margin: "14px 0 6px",
};

const miniText = {
  fontSize: "14px",
  color: "#667085",
  lineHeight: 1.5,
};

const heroRight = {};

const dashboardMockup = {
  display: "flex",
  minHeight: "560px",
  background: "#fff",
  borderRadius: "34px",
  padding: "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 34px 90px rgba(15,23,42,0.12)",
};

const mockSidebar = {
  width: "82px",
  borderRadius: "28px",
  background: "linear-gradient(180deg, #003f32, #006b4f)",
  padding: "20px 0",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: "22px",
};

const activeIcon = {
  width: "46px",
  height: "46px",
  borderRadius: "16px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sideIcon = {
  color: "#fff",
  opacity: 0.9,
};

const mockContent = {
  flex: 1,
  padding: "12px 24px",
};

const mockHeader = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "22px",
};

const mockTitle = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 900,
};

const muted = {
  margin: "5px 0 0",
  color: "#667085",
};

const streak = {
  height: "fit-content",
  padding: "12px 16px",
  borderRadius: "16px",
  background: "#fff7ed",
  color: "#c2410c",
  fontWeight: 900,
};

const mockGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginBottom: "20px",
};

const recommendCard = {
  padding: "24px",
  borderRadius: "24px",
  background: "linear-gradient(135deg, #f0fbf5, #fff)",
  border: "1px solid #e5e7eb",
};

const progressCard = {
  padding: "24px",
  borderRadius: "24px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const mockTopRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const label = {
  margin: 0,
  color: "#667085",
  fontSize: "13px",
  fontWeight: 800,
};

const smallBadge = {
  background: "#dff5ea",
  color: "#00704f",
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: 800,
  fontSize: "12px",
};

const cardTitle = {
  margin: "14px 0 10px",
  fontSize: "22px",
};

const cardText = {
  color: "#667085",
  lineHeight: 1.6,
};

const smallButton = {
  marginTop: "12px",
  border: 0,
  borderRadius: "12px",
  padding: "12px 18px",
  background: "#00704f",
  color: "#fff",
  fontWeight: 900,
};

const circle = {
  width: "125px",
  height: "125px",
  borderRadius: "999px",
  border: "18px solid #00704f",
  margin: "12px auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "30px",
  fontWeight: 950,
};

const skillsList = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: "8px",
  fontSize: "14px",
};

const sessionsCard = {
  padding: "22px",
  borderRadius: "24px",
  background: "#fff",
  border: "1px solid #e5e7eb",
};

const listTitle = {
  margin: 0,
};

const greenSmall = {
  color: "#00704f",
  fontWeight: 800,
};

const sessionRow = {
  display: "flex",
  justifyContent: "space-between",
  borderTop: "1px solid #eef2f7",
  padding: "12px 0",
};

const sessionDate = {
  margin: "3px 0 0",
  color: "#667085",
  fontSize: "13px",
};

const sessionScore = {
  color: "#00704f",
  fontWeight: 900,
};

const tipCard = {
  padding: "24px",
  borderRadius: "24px",
  background: "#f7f3ff",
  border: "1px solid #ede9fe",
  textAlign: "center" as const,
};

const robot = {
  fontSize: "58px",
  margin: "14px 0",
};

const partnersSection = {
  maxWidth: "1400px",
  margin: "40px auto 0",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "26px",
  padding: "22px 30px",
  boxShadow: "0 18px 50px rgba(15,23,42,0.05)",
};

const partnersTitle = {
  textAlign: "center" as const,
  color: "#475467",
  margin: "0 0 16px",
};

const partnersRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
};

const partnerItem = {
  flex: 1,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "26px",
  color: "#101828",
};

const arrow = {
  color: "#00704f",
  fontSize: "30px",
};

const stepsSection = {
  maxWidth: "1400px",
  margin: "16px auto 0",
  padding: "34px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "28px",
};

const sectionKicker = {
  textAlign: "center" as const,
  margin: 0,
  color: "#00704f",
  fontWeight: 950,
  fontSize: "13px",
  letterSpacing: "0.08em",
};

const sectionTitle = {
  margin: "8px 0 30px",
  textAlign: "center" as const,
  fontSize: "32px",
  fontWeight: 950,
};

const stepsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
};

const stepWrap = {
  position: "relative" as const,
};

const stepCard = {
  minHeight: "150px",
  padding: "24px",
  borderRadius: "24px",
  background: "#f8fbf9",
  border: "1px solid #e5e7eb",
};

const stepNumber = {
  position: "absolute" as const,
  top: "-12px",
  left: "-10px",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  background: "#dff5ea",
  color: "#00704f",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 950,
};

const stepIcon = {
  width: "54px",
  height: "54px",
  borderRadius: "18px",
  background: "#e0f6ea",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
};

const stepHeading = {
  margin: "16px 0 8px",
};

const stepText = {
  margin: 0,
  color: "#667085",
  lineHeight: 1.5,
};

const stepArrow = {
  position: "absolute" as const,
  top: "70px",
  right: "-22px",
  color: "#00704f",
  fontWeight: 900,
};

const benefitsRow = {
  maxWidth: "1400px",
  margin: "16px auto 0",
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  background: "linear-gradient(135deg, #eef9f3, #fff)",
  borderRadius: "26px",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
};

const benefitCard = {
  display: "flex",
  gap: "18px",
  padding: "30px",
  borderRight: "1px solid #e5e7eb",
};

const benefitIcon = {
  width: "56px",
  height: "56px",
  borderRadius: "20px",
  background: "#dff5ea",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
};

const benefitTitle = {
  margin: "0 0 8px",
};

const benefitText = {
  margin: 0,
  color: "#667085",
  lineHeight: 1.55,
};

const ctaSection = {
  maxWidth: "1400px",
  margin: "20px auto 0",
  padding: "34px 48px",
  borderRadius: "28px",
  background: "linear-gradient(135deg, #003f32, #062f29)",
  color: "#fff",
  display: "grid",
  gridTemplateColumns: "180px 1fr 240px",
  alignItems: "center",
  gap: "34px",
  boxShadow: "0 28px 80px rgba(0,63,50,0.25)",
};

const robotBox = {
  fontSize: "110px",
};

const ctaTitle = {
  fontSize: "34px",
  margin: 0,
};

const ctaText = {
  color: "rgba(255,255,255,0.76)",
  lineHeight: 1.6,
};

const ctaButton = {
  display: "inline-flex",
  marginTop: "14px",
  padding: "16px 30px",
  borderRadius: "14px",
  background: "#12b981",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
};

const ratingBox = {
  textAlign: "center" as const,
};

const stars = {
  color: "#fbbf24",
  fontSize: "28px",
};

const rating = {
  display: "block",
  fontSize: "42px",
  marginTop: "8px",
};