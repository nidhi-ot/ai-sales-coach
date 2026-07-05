import Link from "next/link";
import {
  Mic,
  Zap,
  ChartNoAxesCombined,
  ShieldCheck,
  UsersRound,
  Building2,
  Phone,
} from "lucide-react";


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
    icon: "👤",
    title: "Choose the setup",
    description:
      "Select the scenario, buyer persona, sales framework, and focus area.",
  },
  {
    number: "02",
    icon: "🤖",
    title: "Speak with the AI buyer",
    description:
      "Run a live voice call with a realistic buyer and practice handling real objections.",
  },
  {
    number: "03",
    icon: "📈",
    title: "Review your scorecard",
    description:
      "Get instant feedback on your strengths, improvement areas, and next best actions.",
  },
  {
    number: "04",
    icon: "🎯",
    title: "Improve and repeat",
    description:
      "Use your insights, track progress, and come back stronger next time.",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Safer practice before real calls",
    description:
      "Reps can rehearse difficult conversations before speaking with live prospects or customers.",
  },
  {
    icon: UsersRound,
    title: "Consistent coaching language",
    description:
      "Managers and reps use the same scorecard categories and sales framework to align and improve together.",
  },
  {
    icon: Building2,
    title: "Built for real service conversations",
    description:
      "Practice scenarios reflect cleaning, property maintenance, BRF, and facility service buyer conversations.",
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
  {
    question: "How is my data used?",
    answer:
      "Practice sessions are used to generate transcripts, scorecards, and progress insights for the rep and team.",
  },
  {
    question: "Do I need training to get started?",
    answer:
      "No. Reps can choose a scenario, start a practice call, and review feedback immediately after the session.",
  },
];

const proofCards = [
  {
    icon: Mic,
    title: "Live practice",
    description:
      "Have realistic voice conversations with AI buyers based on real customer scenarios.",
  },
  {
    icon: Zap,
    title: "Instant scorecards",
    description:
      "Get AI feedback on talking points, objections, and closing right after every call.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Progress tracking",
    description:
      "Track your performance over time and focus on the skills that drive better results.",
  },
];

export default function HomePage() {
  return (
    <main style={pageStyle}>
      <div style={backgroundGlowLeft} />
      <div style={backgroundGlowRight} />

      <section style={shellStyle}>
        <style>{`
          html,
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            overflow-x: hidden;
          }

          * {
            box-sizing: border-box;
          }
          .mobileHeaderMenu {
            display: none;
          }

          .mobileHeaderMenu summary::-webkit-details-marker {
            display: none;
          }

          @media (max-width: 820px) {
            .desktopHeaderActions {
              display: none !important;
            }

            .mobileHeaderMenu {
              display: block;
            }
          }

          @media (max-width: 900px) {
            .footerContent {
              grid-template-columns: 1fr !important;
            }

            .footerColumns {
              margin-left: 64px;
            }
          }

          @media (max-width: 560px) {
            .footerColumns {
              margin-left: 0;
            }
          }

          @media (max-width: 980px) {
            .heroSection {
              padding-bottom: 54px !important;
            }

            .heroPreview {
              min-height: 540px !important;
              transform: scale(0.9);
              transform-origin: center top;
            }
          }

          @media (max-width: 720px) {
            .heroSection {
              padding: 34px 20px 82px !important;
              margin-left: -20px !important;
              margin-right: -20px !important;
              border-radius: 24px !important;
            }

            .heroPreview {
              min-height: 500px !important;
              transform: scale(0.74);
            }

            .phoneBack {
              left: 42px !important;
            }

            .phoneFront {
              right: 36px !important;
            }
          }

          @media (max-width: 520px) {
            .heroPreview {
              min-height: 430px !important;
              transform: scale(0.62);
            }

            .phoneBack {
              left: 20px !important;
            }

            .phoneFront {
              right: 18px !important;
            }
          }
        `}</style>

        <header style={headerStyle}>
          <div style={brandWrapStyle}>
            <img src="/logo.png" alt="AI Sales Coach" style={logoStyle} />
            <div>
              <p style={eyebrowStyle}>AI Sales Coach</p>
              <p style={brandCopyStyle}>Practice calls. Get coaching. Improve faster.</p>
            </div>
          </div>

          <nav
            className="desktopHeaderActions"
            style={headerActionsStyle}
            aria-label="Homepage actions"
          >
            <Link href="#contact" style={contactButtonStyle}>
              <Phone size={16} strokeWidth={2.4} />
              Contact Support
            </Link>
            <Link href="/login" style={ghostButtonStyle}>
              Log in
            </Link>
            <Link href="/register" style={primaryButtonStyle}>
              Create account
            </Link>
          </nav>

          <details className="mobileHeaderMenu" style={mobileMenuStyle}>
            <summary style={mobileMenuButtonStyle} aria-label="Open menu">
              ☰
            </summary>

            <div style={mobileMenuPanelStyle}>
              <Link href="#contact" style={mobileMenuLinkStyle}>
                Contact Support
              </Link>
              <Link href="/login" style={mobileMenuLinkStyle}>
                Log in
              </Link>
              <Link href="/register" style={mobileMenuPrimaryLinkStyle}>
                Create account
              </Link>
            </div>
          </details>
        </header>

        <section className="heroSection" style={heroSectionStyle}>
          <div style={heroCopyStyle}>
            <span style={pillStyle}>
              AI-powered sales practice for real buyer conversations
            </span>

            <h1 style={titleStyle}>
              Practice sales calls before they <span style={titleAccentStyle}>count</span>.
            </h1>

            <p style={leadStyle}>
              Train with realistic AI buyer personas, handle objections out loud,
              and review instant scorecards that show what to improve next.
            </p>

            <div style={heroActionsStyle}>
              <Link href="/register" style={primaryButtonLargeStyle}>
                Start practicing →
              </Link>
              <Link href="/login" style={secondaryButtonLargeStyle}>
                Log in
              </Link>
            </div>

            <div style={heroTrustStyle}>
              <div style={avatarStackStyle} aria-hidden="true">
                <span style={{ ...avatarStyle, background: "#d8f3e8" }}>A</span>
                <span style={{ ...avatarStyle, background: "#f5e7d8" }}>M</span>
                <span style={{ ...avatarStyle, background: "#e8efe6" }}>S</span>
                <span style={{ ...avatarStyle, background: "#e6f4ef" }}>J</span>
              </div>

              <span style={trustTextStyle}>Trusted by sales reps and teams</span>
            </div>
          </div>

          <aside className="heroPreview" style={heroPreviewStyle} aria-label="AI Sales Coach mobile product preview">
            <div className="phoneBack" style={{ ...phoneMockupStyle, ...phoneBackStyle }}>
              <div style={phoneStatusBarStyle}>
                <span>9:41</span>
                <span style={phoneSpeakerStyle} />
                <span>▴ ▌</span>
              </div>

              <div style={phoneDashboardHeaderStyle}>
                <div>
                  <h2 style={phoneTitleStyle}>Good morning, Alex</h2>
                  <p style={phoneSubtitleStyle}>Ready for today&apos;s practice?</p>
                </div>
                <span style={phoneMiniStatusStyle}>Continue ▶</span>
              </div>

              <div style={phoneDashboardCardStyle}>
                <div style={phoneDashboardCardHeaderStyle}>
                  <p style={phoneSmallLabelStyle}>Recommended practice</p>
                  <span style={phoneForYouStyle}>For you</span>
                </div>
                <h3 style={phoneCardTitleStyle}>Objection handling — Price</h3>
                <p style={phoneCardTextStyle}>
                  Practice responding when customers say the service is too expensive.
                </p>
                <button style={phoneButtonCreamStyle}>Start practice →</button>
              </div>
            </div>

            <div className="phoneFront" style={{ ...phoneMockupStyle, ...phoneFrontStyle }}>
              <div style={phoneStatusBarStyle}>
                <span>9:41</span>
                <span style={phoneSpeakerStyle} />
                <span>▴ ▌</span>
              </div>

              <div style={phoneCallHeaderStyle}>
                <span style={phoneAvatarStyle}>AI</span>
                <div>
                  <h2 style={phoneCallTitleStyle}>Price objection practice</h2>
                  <p style={phoneSubtitleStyle}>Discovery call</p>
                </div>
                <span style={phoneLiveBadgeStyle}>Live</span>
              </div>

              <div style={phonePersonaCardStyle}>
                <span style={phonePersonaIconStyle}>JS</span>
                <h3 style={phonePersonaNameStyle}>James Wilson</h3>
                <p style={phoneSubtitleStyle}>Facilities buyer</p>
              </div>

              <div style={phoneQuoteStyle}>
                “Your service sounds useful, but the price seems high compared to what we pay now.”
              </div>

              <button style={phoneTalkButtonStyle}>End Call</button>
            </div>
          </aside>
        </section>

        <section id="features" style={proofCardsStyle}>
          {proofCards.map((card) => (
            <article key={card.title} style={proofCardStyle}>
              <span style={proofIconStyle}>
                <card.icon size={24} strokeWidth={2.2} color="#ffffff" />
              </span>
              <div>
                <h3 style={proofTitleStyle}>{card.title}</h3>
                <p style={proofTextStyle}>{card.description}</p>
              </div>
            </article>
          ))}
        </section>

        <section id="overview" style={overviewBandStyle}>
          <div>
            <p style={sectionKickerStyle}>Product overview</p>
            <h2 style={overviewTitleStyle}>
              A focused practice loop for better sales conversations.
            </h2>
          </div>

          <p style={overviewTextStyle}>
            AI Sales Coach helps reps prepare for customer conversations by turning
            practice into a repeatable workflow: choose a scenario, speak with a
            realistic AI buyer, review the scorecard, and use the next session to
            improve the weakest skill.
          </p>
        </section>

        <section id="how-it-works" style={workflowSectionStyle}>
          <div style={workflowHeaderStyle}>
            <p style={sectionKickerStyle}>How it works</p>
            <h2 style={workflowTitleStyle}>
              The workflow stays focused from start to finish.
            </h2>
          </div>

          <div style={stepsGridStyle}>
            {steps.map((step, index) => (
              <article key={step.number} style={stepCardStyle}>
                <span style={stepNumberStyle}>{step.number}</span>
                <span style={stepIconStyle}>{step.icon}</span>
                <h3 style={stepTitleStyle}>{step.title}</h3>
                <p style={stepTextStyle}>{step.description}</p>

                {index < steps.length - 1 && <span style={stepArrowStyle}>→</span>}
              </article>
            ))}
          </div>
        </section>

        <section id="benefits" style={benefitsSectionStyle}>
          <div style={benefitsHeaderStyle}>
            <p style={sectionKickerStyle}>Benefits for sales teams</p>
            <h2 style={benefitsTitleStyle}>
              Practice becomes repeatable, measurable, and easier to coach.
            </h2>
          </div>

          <div style={benefitsGridStyle}>
            {benefits.map((item) => (
              <article key={item.title} style={benefitCardStyle}>
                <span style={benefitIconStyle}>
                  <item.icon size={34} strokeWidth={2.1} color="#006b4f" />
                </span>

                <div>
                  <h3 style={benefitTitleStyle}>{item.title}</h3>
                  <p style={benefitTextStyle}>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

       <section id="faq" style={faqSectionStyle}>
        <div style={faqHeaderStyle}>
          <p style={sectionKickerStyle}>FAQ</p>
          <h2 style={faqTitleStyle}>
            Common questions
            <br />
            before the first practice call.
          </h2>
        </div>

        <div style={faqListStyle}>
          {faqs.map((item) => (
            <details key={item.question} style={faqItemStyle}>
              <summary style={faqQuestionStyle}>
                {item.question}
                <span style={faqChevronStyle}>⌄</span>
              </summary>
              <p style={faqAnswerStyle}>{item.answer}</p>
            </details>
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
                Our team is ready to help with technical issues, account questions, practice sessions, scorecards, and general product support. Send us a message and we&apos;ll respond as soon as possible.
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
              <p style={{ margin: 0, color: "#667085", fontSize: "13px" }}>
              Sending this form opens your email client.
            </p>

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
          <div className="footerContent" style={footerContentStyle}>
            <div style={footerBrandStyle}>
              <img src="/logo.png" alt="AI Sales Coach" style={footerLogoImageStyle} />

              <div>
                <p style={footerLogoStyle}>AI SALES COACH</p>

                <p style={footerDescriptionStyle}>
                  AI-powered sales practice that helps reps rehearse realistic buyer
                  conversations, review scorecards, and improve one call at a time.
                </p>

                <div style={footerSocialStyle}>
                  <a
                    href="https://www.linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={footerSocialLinkStyle}
                  >
                    in
                  </a>
                  <a
                    href="https://www.instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={footerSocialLinkStyle}
                  >
                    ◙
                  </a>
                </div>

                <p style={footerBottomStyle}>
                  © 2026 AI Sales Coach. All rights reserved.
                </p>
              </div>
            </div>

            <div className="footerColumns" style={footerColumnsStyle}>
              <div style={footerColumnStyle}>
                <p style={footerColumnTitleStyle}>Product</p>
                <Link href="#how-it-works" style={footerLinkStyle}>How it works</Link>
                <Link href="#features" style={footerLinkStyle}>Features</Link>
                <Link href="#benefits" style={footerLinkStyle}>For teams</Link>
                <Link href="/login" style={footerLinkStyle}>Log In</Link>
              </div>

              <div style={footerColumnStyle}>
                <p style={footerColumnTitleStyle}>Resources</p>
                <Link href="#contact" style={footerLinkStyle}>Help center</Link>
                <Link href="#how-it-works" style={footerLinkStyle}>Guides</Link>
                <Link href="#faq" style={footerLinkStyle}>FAQ</Link>
                <Link href="#contact" style={footerLinkStyle}>Contact support</Link>
              </div>

              <div style={footerColumnStyle}>
                <p style={footerColumnTitleStyle}>Company</p>
                <Link href="#overview" style={footerLinkStyle}>About</Link>
              </div>
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
  overflow: "hidden" as const,
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
  background: "radial-gradient(circle, rgba(0,107,79,0.10) 0%, rgba(0,107,79,0) 70%)",
  filter: "blur(8px)",
};

const shellStyle = {
  position: "relative" as const,
  maxWidth: "1320px",
  margin: "0 auto",
  padding: "0 32px 0",
};

const headerStyle = {
  position: "sticky" as const,
  top: 0,
  zIndex: 50,
  background: "rgba(248, 251, 249, 0.96)",
  backdropFilter: "blur(14px)",
  borderBottom: "1px solid rgba(226,232,240,0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "24px",
  flexWrap: "nowrap" as const,
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  marginBottom: "30px",
  padding: "18px max(16px, calc((100vw - 1320px) / 2 + 20px))",
};

const mobileMenuStyle = {
  position: "relative" as const,
  flexShrink: 0,
};

const mobileMenuButtonStyle = {
  width: "56px",
  height: "56px",
  borderRadius: "999px",
  border: "1px solid #C9DAD2",
  background: "rgba(255,255,255,0.88)",
  color: "#101828",
  display: "grid",
  placeItems: "center",
  fontSize: "28px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(16,24,40,0.08)",
  listStyle: "none",
};

const mobileMenuPanelStyle = {
  position: "absolute" as const,
  right: 0,
  top: "calc(100% + 12px)",
  width: "220px",
  padding: "12px",
  borderRadius: "18px",
  border: "1px solid #D8E5DE",
  background: "#ffffff",
  boxShadow: "0 18px 40px rgba(16,24,40,0.16)",
  display: "grid",
  gap: "8px",
  zIndex: 80,
};

const mobileMenuLinkStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  color: "#101828",
  fontWeight: 800,
  textDecoration: "none",
};

const mobileMenuPrimaryLinkStyle = {
  ...mobileMenuLinkStyle,
  background: "#007a5a",
  color: "#ffffff",
};

const brandWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "2px",
  flexShrink: 0,
};

const logoStyle = {
  width: "74px",
  height: "74px",
  objectFit: "contain" as const,
  flexShrink: 0,
};

const eyebrowStyle = {
  margin: 0,
  fontSize: "17px",
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: "0.01em",
  textTransform: "uppercase" as const,
  color: "#006b4f",
};

const brandCopyStyle = {
  margin: "4px 0 0",
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: 1.05,
  color: "#344054",
};

const headerActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "nowrap" as const,
  whiteSpace: "nowrap" as const,
  flexShrink: 0,
};

const heroSectionStyle = {
  position: "relative" as const,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
  gap: "46px",
  alignItems: "center",
  padding: "46px 28px 96px",
  marginLeft: "-28px",
  marginRight: "-28px",
  borderRadius: "34px",
  background:
    "radial-gradient(circle at 78% 12%, rgba(0,107,79,0.16), transparent 34%), radial-gradient(circle at 96% 44%, rgba(245,231,216,0.72), transparent 30%), radial-gradient(circle at 18% 88%, rgba(216,243,232,0.70), transparent 34%), linear-gradient(135deg, #fbfefc 0%, #f4faf7 100%)",
  overflow: "hidden",
};

const heroCopyStyle = {
  display: "grid",
  gap: "20px",
  justifyItems: "start",
  paddingTop: "42px",
};

const heroPreviewStyle = {
  position: "relative" as const,
  minHeight: "610px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const phoneMockupStyle = {
  position: "absolute" as const,
  width: "280px",
  minHeight: "520px",
  borderRadius: "38px",
  border: "10px solid #101828",
  boxShadow: "0 34px 80px rgba(15, 23, 42, 0.28)",
  color: "#ffffff",
  overflow: "hidden",
};

const phoneBackStyle = {
  left: "70px",
  top: "18px",
  transform: "rotate(-7deg)",
  zIndex: 1,
  background: "linear-gradient(160deg, #07111f 0%, #063c33 100%)",
};

const phoneFrontStyle = {
  right: "58px",
  top: "66px",
  transform: "rotate(7deg)",
  zIndex: 2,
  background: "#080d16",
};

const phoneDashboardHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  padding: "12px 22px 16px",
};

const phoneMiniStatusStyle = {
  padding: "8px 10px",
  borderRadius: "999px",
  background: "rgba(231,244,239,0.14)",
  color: "#9dd9c3",
  fontSize: "11px",
  fontWeight: 900,
  whiteSpace: "nowrap" as const,
};

const phoneDashboardCardStyle = {
  margin: "0 22px 14px",
  padding: "18px",
  borderRadius: "22px",
  background: "rgba(247,252,250,0.08)",
  border: "1px solid rgba(157,217,195,0.22)",
};

const phoneDashboardCardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};

const phoneForYouStyle = {
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(231,244,239,0.14)",
  color: "#9dd9c3",
  fontSize: "11px",
  fontWeight: 900,
};

const phoneMiniGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  margin: "0 22px 14px",
};

const phoneMiniPanelStyle = {
  padding: "14px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const phoneMiniScoreRingStyle = {
  width: "72px",
  height: "72px",
  margin: "10px auto 0",
  borderRadius: "999px",
  border: "10px solid #007a5a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff",
  fontWeight: 900,
};

const phoneMiniRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  margin: "8px 0",
  color: "#e2e8f0",
  fontSize: "11px",
};

const phoneTipPanelStyle = {
  margin: "0 22px",
  padding: "16px",
  borderRadius: "20px",
  background: "rgba(231,244,239,0.12)",
  border: "1px solid rgba(157,217,195,0.18)",
  textAlign: "center" as const,
};

const phoneStatusBarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 24px 10px",
  color: "#cbd5e1",
  fontSize: "13px",
  fontWeight: 800,
};

const phoneSpeakerStyle = {
  width: "92px",
  height: "24px",
  borderRadius: "999px",
  background: "#020617",
};

const phoneTitleStyle = {
  margin: "10px 24px 4px",
  fontSize: "26px",
  lineHeight: 1.12,
};

const phoneSubtitleStyle = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "15px",
};

const phoneChipRowStyle = {
  display: "flex",
  gap: "10px",
  padding: "24px 24px 12px",
};

const phoneChipStyle = {
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: "999px",
  padding: "10px 14px",
  color: "#e2e8f0",
  fontSize: "13px",
  fontWeight: 800,
};

const phoneProgressStyle = {
  margin: "4px 24px 20px",
  height: "12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.12)",
  overflow: "hidden",
};

const phoneProgressFillStyle = {
  display: "block",
  width: "72%",
  height: "100%",
  borderRadius: "999px",
  background: "#9dd9c3",
};

const phoneGradientCardStyle = {
  margin: "0 24px",
  padding: "22px",
  borderRadius: "28px",
  background: "linear-gradient(145deg, #007a5a 0%, #5fbf9f 100%)",
  boxShadow: "0 24px 44px rgba(0,0,0,0.25)",
};

const phoneSmallLabelStyle = {
  margin: 0,
  color: "rgba(255,255,255,0.82)",
  fontSize: "13px",
  fontWeight: 800,
};

const phoneCardTitleStyle = {
  margin: "12px 0",
  fontSize: "26px",
  lineHeight: 1.15,
};

const phoneCardTextStyle = {
  margin: 0,
  color: "rgba(255,255,255,0.82)",
  lineHeight: 1.5,
};

const phoneButtonCreamStyle = {
  marginTop: "24px",
  width: "100%",
  border: "none",
  borderRadius: "999px",
  padding: "14px 18px",
  background: "#fff3e8",
  color: "#101828",
  fontWeight: 900,
  textTransform: "uppercase" as const,
};

const phoneCallHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "44px 1fr auto",
  alignItems: "center",
  gap: "12px",
  padding: "20px 24px",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
};

const phoneAvatarStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  background: "#006b4f",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff",
  fontWeight: 900,
};

const phoneCallTitleStyle = {
  margin: 0,
  fontSize: "18px",
  lineHeight: 1.2,
};

const phoneLiveBadgeStyle = {
  borderRadius: "999px",
  padding: "8px 12px",
  background: "rgba(0,107,79,0.26)",
  color: "#54d6a7",
  fontSize: "12px",
  fontWeight: 900,
};

const phonePersonaCardStyle = {
  margin: "24px",
  padding: "24px",
  borderRadius: "28px",
  border: "2px solid #b9794c",
  textAlign: "center" as const,
};

const phonePersonaIconStyle = {
  width: "78px",
  height: "78px",
  margin: "0 auto 14px",
  borderRadius: "24px",
  background: "#006b4f",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: "22px",
};

const phonePersonaNameStyle = {
  margin: "0 0 4px",
  fontSize: "22px",
};

const phoneQuoteStyle = {
  margin: "0 25px",
  padding: "16px",
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#e5e7eb",
  lineHeight: 1.35,
  fontSize: "14px",
};

const phoneTalkButtonStyle = {
  display: "block",
  width: "calc(100% - 52px)",
  margin: "18px 27px 8px",
  border: "none",
  borderRadius: "999px",
  padding: "16px",
  background: "#fff3e8",
  color: "#101828",
  fontSize: "18px",
  fontWeight: 900,
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
  margin: "16px 0 12px",
  fontSize: "clamp(44px, 4.4vw, 60px)",
  lineHeight: 1.08,
  letterSpacing: 0,
  maxWidth: "12ch",
};

const titleAccentStyle = {
  color: "#006b4f",
};

const heroTrustStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginTop: "10px",
};

const avatarStackStyle = {
  display: "flex",
  alignItems: "center",
};

const avatarStyle = {
  width: "34px",
  height: "34px",
  marginLeft: "-8px",
  borderRadius: "999px",
  border: "2px solid #ffffff",
  color: "#064e3b",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: 900,
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.12)",
};

const trustTextStyle = {
  color: "#667085",
  fontSize: "15px",
  fontWeight: 700,
};

const leadStyle = {
  margin: 0,
  maxWidth: "46ch",
  fontSize: "17px",
  lineHeight: 1.75,
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
  padding: "0 clamp(10px, 1vw, 18px)",
  borderRadius: "999px",
  background: "#006b4f",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: "clamp(13px, 1vw, 16px)",
  whiteSpace: "nowrap" as const,
  flexShrink: 1,
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

const proofCardsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: "22px",
  margin: "28px 0 50px",
  scrollMarginTop: "120px",
};

const proofCardStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "18px",
  minHeight: "118px",
  background: "rgba(255,255,255,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "18px",
  padding: "24px 28px",
  boxShadow: "0 16px 42px rgba(15, 23, 42, 0.08)",
};

const proofIconStyle = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "#4CAF72",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const proofTitleStyle = {
  margin: "0 0 8px",
  fontSize: "18px",
  lineHeight: 1.3,
  color: "#101828",
};

const proofTextStyle = {
  margin: 0,
  color: "#475467",
  fontSize: "14px",
  lineHeight: 1.55,
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

const benefitsSectionStyle = {
  marginTop: "62px",
  scrollMarginTop: "120px",
};

const benefitsHeaderStyle = {
  marginBottom: "30px",
};

const benefitsTitleStyle = {
  margin: "8px 0 0",
  maxWidth: "34ch",
  fontSize: "32px",
  lineHeight: 1.18,
  color: "#101828",
};

const benefitsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: "26px",
};

const benefitCardStyle = {
  display: "grid",
  gridTemplateColumns: "54px 1fr",
  gap: "22px",
  alignItems: "start",
  minHeight: "130px",
  background: "rgba(255,255,255,0.94)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "18px",
  padding: "30px",
  boxShadow: "0 18px 46px rgba(15, 23, 42, 0.07)",
};

const benefitIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "44px",
  height: "44px",
  color: "#006b4f",
};

const benefitTitleStyle = {
  margin: "0 0 10px",
  fontSize: "18px",
  lineHeight: 1.25,
  color: "#101828",
};

const benefitTextStyle = {
  margin: 0,
  color: "#667085",
  fontSize: "14px",
  lineHeight: 1.65,
};

const overviewBandStyle = {
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  padding: "34px max(40px, calc((100vw - 1320px) / 2 + 32px))",
  background:
    "linear-gradient(90deg, rgba(239,248,244,0.95) 0%, rgba(255,255,255,0.96) 100%)",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  alignItems: "start",
  scrollMarginTop: "120px",
};

const overviewTitleStyle = {
  margin: "10px 0 0",
  maxWidth: "23ch",
  fontSize: "30px",
  lineHeight: 1.18,
  fontWeight: 900,
  color: "#101828",
};

const overviewTextStyle = {
  margin: "14px 0 0",
  maxWidth: "62ch",
  color: "#344054",
  fontSize: "16px",
  lineHeight: 1.55,
};

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px",
};

const workflowSectionStyle = {
  marginTop: "62px",
  textAlign: "center" as const,
  scrollMarginTop: "120px",
};

const workflowHeaderStyle = {
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  marginBottom: "30px",
};

const workflowTitleStyle = {
  margin: 0,
  fontSize: "34px",
  lineHeight: 1.2,
  color: "#101828",
};

const stepsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: "24px",
};

const stepCardStyle = {
  position: "relative" as const,
  minHeight: "250px",
  background: "rgba(255,255,255,0.86)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "18px",
  padding: "28px 24px",
  textAlign: "left" as const,
  boxShadow: "0 16px 42px rgba(15, 23, 42, 0.06)",
};

const stepNumberStyle = {
  position: "absolute" as const,
  top: "18px",
  left: "18px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  background: "#e7f4ef",
  color: "#006b4f",
  fontWeight: 900,
  fontSize: "13px",
};

const stepIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "58px",
  height: "58px",
  borderRadius: "18px",
  background: "#f0faf6",
  color: "#006b4f",
  fontSize: "28px",
  margin: "42px 0 28px",
};

const stepTitleStyle = {
  margin: "0 0 12px",
  fontSize: "18px",
  color: "#101828",
};

const stepTextStyle = {
  margin: 0,
  color: "#667085",
  fontSize: "14px",
  lineHeight: 1.65,
};

const stepArrowStyle = {
  position: "absolute" as const,
  right: "-23px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#7fc6ad",
  fontSize: "28px",
  fontWeight: 900,
  zIndex: 2,
};

const contactSectionStyle = {
  marginTop: "28px",
  scrollMarginTop: "120px",
};

const contactCardStyle = {
  display: "grid",
  justifyItems: "start",
  gap: "18px",
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
  width: "100%",
  maxWidth: "650px",
};

const contactFormRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
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

const contactButtonStyle = {
  ...primaryButtonStyle,
  gap: "8px",
  background: "rgba(255,255,255,0.82)",
  color: "#006b4f",
  boxShadow: "inset 0 0 0 1px rgba(0,107,79,0.28)",
};

const faqSectionStyle = {
  marginTop: "62px",
  scrollMarginTop: "120px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: "80px",
  alignItems: "start",
};

const faqHeaderStyle = {
  paddingTop: "8px",
};

const faqTitleStyle = {
  margin: "8px 0 0",
  maxWidth: "34ch",
  fontSize: "32px",
  lineHeight: 1.18,
  color: "#101828",
};

const faqListStyle = {
  display: "grid",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "18px",
  overflow: "hidden",
  boxShadow: "0 18px 46px rgba(15, 23, 42, 0.07)",
};

const faqItemStyle = {
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  padding: "0",
};

const faqQuestionStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "18px",
  padding: "18px 24px",
  color: "#101828",
  fontSize: "15px",
  fontWeight: 800,
  cursor: "pointer",
  listStyle: "none",
};

const faqChevronStyle = {
  color: "#667085",
  fontSize: "18px",
};

const faqAnswerStyle = {
  margin: "0",
  padding: "0 24px 18px",
  color: "#667085",
  fontSize: "14px",
  lineHeight: 1.65,
};

const footerStyle = {
  marginTop: "28px",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  background: "linear-gradient(90deg,#F7FCF9 0%,#FFFFFF 100%)",
  borderTop: "1px solid #E7EFEA",
  color: "#101828",
};

const footerContentStyle = {
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "28px 32px 20px",
  display: "grid",
  gridTemplateColumns: "minmax(320px, 1fr) minmax(420px, 1.6fr)",
  gap: "32px 64px",
  alignItems: "flex-start",
};

const footerBrandStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "18px",
  flex: "1 1 320px",
  minWidth: 0,
};

const footerLogoImageStyle = {
  width: "46px",
  height: "46px",
  objectFit: "contain" as const,
};

const footerLogoStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 900,
  color: "#006B4F",
  letterSpacing: "0.03em",
};

const footerDescriptionStyle = {
  margin: "8px 0 0",
  maxWidth: "340px",
  color: "#475467",
  fontSize: "14px",
  lineHeight: 1.7,
};

const footerSocialStyle = {
  display: "flex",
  gap: "14px",
  marginTop: "12px",
  color: "#344054",
  fontSize: "20px",
};

const footerSocialLinkStyle = {
  color: "#101828",
  display: "inline-flex",
  alignItems: "center",
  textDecoration: "none",
};

const footerColumnsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "32px 64px",
};

const footerColumnStyle = {
  display: "grid",
  gap: "10px",
  alignContent: "start",
};

const footerColumnTitleStyle = {
  margin: "0 0 6px",
  color: "#006B4F",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

const footerLinkStyle = {
  color: "#344054",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 500,
};

const footerBottomStyle = {
  marginTop: "12px",
  color: "#667085",
  fontSize: "13px",
};
