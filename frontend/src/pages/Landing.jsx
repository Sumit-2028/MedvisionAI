import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Cpu,
  FileText,
  HeartPulse,
  LockKeyhole,
  Menu,
  Play,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  UploadCloud,
  UserRound,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./landing.css";

const navItems = [
  ["Home", "home"],
  ["Features", "features"],
  ["How It Works", "how-it-works"],
  ["Technology", "technology"],
  ["About", "about"],
];

const featureCards = [
  [ScanLine, "AI-Powered X-Ray Analysis", "Review 14 chest X-ray conditions with DenseNet121-assisted findings and probability context."],
  [Users, "Patient Management", "Keep patient profiles and their complete diagnosis history organized in one physician-focused workspace."],
  [FileText, "Automated Medical Reports", "Generate consistent medical reports with structured findings ready for physician review."],
  [ShieldCheck, "Secure & Reliable", "Use authenticated, physician-owned workflows designed for responsible medical data management."],
];

const workflowSteps = [
  [LockKeyhole, "Login", "Secure access for physicians"],
  [UserRound, "Select Patient", "Choose or create a patient"],
  [UploadCloud, "Upload X-Ray", "Add a chest X-ray image"],
  [BrainCircuit, "AI Analysis", "Review assisted findings"],
  [ClipboardCheck, "Review & Report", "Validate and generate a report"],
];

const technologyHighlights = [
  [Cpu, "Deep Learning", "DenseNet121"],
  [Activity, "14 Conditions", "Comprehensive detection"],
  [Workflow, "Research Driven", "Built for real-world impact"],
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });

    const sections = navItems
      .map(([, id]) => document.getElementById(id))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-25% 0px -55%", threshold: [0.05, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));

    const revealObserver = new IntersectionObserver(
      (entries, revealInstance) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealInstance.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );
    document.querySelectorAll(".mv-landing .mv-reveal").forEach((element) => revealObserver.observe(element));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      revealObserver.disconnect();
    };
  }, []);

  const goTo = (id) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <div className="mv-landing">
      <header className={`mv-nav ${scrolled ? "mv-nav--scrolled" : ""}`}>
        <div className="mv-container mv-nav__inner">
          <button className="mv-brand" type="button" onClick={() => goTo("home")} aria-label="MedVision AI home">
            <span className="mv-brand__mark"><HeartPulse size={22} strokeWidth={2.3} /></span>
            <span><strong>MedVision AI</strong><small>AI for a Healthier Tomorrow</small></span>
          </button>

          <nav className={`mv-nav__links ${menuOpen ? "mv-nav__links--open" : ""}`} aria-label="Landing page navigation">
            {navItems.map(([label, id]) => (
              <button key={id} type="button" className={activeSection === id ? "is-active" : ""} onClick={() => goTo(id)}>
                {label}
              </button>
            ))}
            <div className="mv-nav__mobile-actions">
              <button type="button" className="mv-button mv-button--outline" onClick={() => navigate("/login")}>Login</button>
              <button type="button" className="mv-button mv-button--primary" onClick={() => navigate("/login")}>Get Started <ArrowRight size={15} /></button>
            </div>
          </nav>

          <div className="mv-nav__actions">
            <button type="button" className="mv-button mv-button--outline mv-nav__login" onClick={() => navigate("/login")}>Login</button>
            <button type="button" className="mv-button mv-button--primary" onClick={() => navigate("/login")}>Get Started <ArrowRight size={15} /></button>
          </div>

          <button type="button" className="mv-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main>
        <section id="home" className="mv-hero mv-section-anchor">
          <div className="mv-ambient mv-ambient--hero" />
          <div className="mv-grid-lines" />
          <div className="mv-container mv-hero__grid">
            <div className="mv-hero__copy mv-reveal mv-reveal--one">
              <p className="mv-kicker"><span className="mv-kicker__dot" /> AI-POWERED RADIOLOGY PLATFORM</p>
              <h1>Smarter Radiology.<br /><span>Better Patient Care.</span></h1>
              <p className="mv-hero__description">MedVision AI helps physicians analyze chest X-rays, manage patients, and generate comprehensive medical reports — all in one secure and intelligent platform.</p>
              <div className="mv-hero__actions mv-reveal mv-reveal--two">
                <button type="button" className="mv-button mv-button--primary mv-button--large" onClick={() => navigate("/login")}>Get Started <ArrowRight size={18} /></button>
                <button type="button" className="mv-button mv-button--outline mv-button--large" onClick={() => goTo("how-it-works")}><Play size={15} fill="currentColor" /> Watch Demo</button>
              </div>
              <p className="mv-hero__note">AI-assisted assessment — not a definitive diagnosis.</p>
              <div className="mv-trust-row mv-reveal mv-reveal--three">
                <TrustItem icon={BrainCircuit} label="AI-Assisted Analysis" />
                <TrustItem icon={ShieldCheck} label="Secure & Reliable" />
                <TrustItem icon={Stethoscope} label="Designed for Physicians" />
              </div>
            </div>

            <div className="mv-hero__visual mv-reveal mv-reveal--two" aria-label="Illustrative AI radiology workspace">
              <RadiologyVisual variant="hero" />
              <div className="mv-demo-label"><span className="mv-demo-dot" /> Illustrative interface · Demo values only</div>
            </div>
          </div>
        </section>

        <section className="mv-stat-bar" aria-label="MedVision AI highlights">
          <div className="mv-container mv-stat-grid">
            <Stat value="14" label="Chest X-Ray Conditions" />
            <Stat value="Fast" label="AI-Assisted Analysis" />
            <Stat value="Secure" label="& Private" />
            <Stat value="Physician" label="Focused" />
          </div>
        </section>

        <section id="features" className="mv-section mv-section-anchor mv-healthcare">
          <div className="mv-container">
            <div className="mv-healthcare__grid">
              <div className="mv-healthcare__copy mv-reveal">
                <p className="mv-kicker">DESIGNED FOR REAL-WORLD HEALTHCARE</p>
                <h2>Designed for Real-World Healthcare</h2>
                <p>MedVision AI combines advanced deep learning with a physician-first approach to help you analyze chest X-rays, manage patients, and create detailed medical reports with confidence.</p>
                <button type="button" className="mv-button mv-button--primary" onClick={() => goTo("features")}>Explore Features <ArrowRight size={16} /></button>
                <div className="mv-support-note"><span>Technology supports.</span><span>It doesn’t replace human expertise.</span></div>
              </div>
              <div className="mv-healthcare__visual mv-reveal mv-reveal--two"><ClinicalMonitorVisual /></div>
            </div>
            <div className="mv-feature-grid">
              {featureCards.map(([Icon, title, description], index) => (
                <article key={title} className="mv-glass-card mv-feature-card mv-reveal" style={{ "--mv-delay": `${index * 80}ms` }}>
                  <span className="mv-icon-box"><Icon size={21} /></span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className="mv-card-arrow"><ChevronRight size={17} /></span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mv-section mv-section-anchor mv-workflow">
          <div className="mv-container">
            <SectionHeading kicker="HOW IT WORKS" title="How MedVision AI Works" subtitle="A simple and seamless workflow for smarter clinical decisions." centered />
            <div className="mv-workflow__grid">
              {workflowSteps.map(([Icon, title, description], index) => (
                <div className="mv-step mv-reveal" style={{ "--mv-delay": `${index * 100}ms` }} key={title}>
                  <div className="mv-step__icon"><Icon size={21} /></div>
                  <span className="mv-step__number">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  {index < workflowSteps.length - 1 && <ArrowRight className="mv-step__arrow" size={17} />}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="technology" className="mv-section mv-section-anchor mv-technology">
          <div className="mv-container mv-technology__grid">
            <div className="mv-technology__visual mv-reveal"><TechnologyVisual /></div>
            <div className="mv-technology__copy mv-reveal mv-reveal--two">
              <p className="mv-kicker">ADVANCED AI TECHNOLOGY</p>
              <h2>Built on DenseNet121</h2>
              <p>MedVision AI uses a DenseNet121 deep learning model trained to classify 14 chest X-ray conditions, providing AI-assisted analysis for physicians.</p>
              <div className="mv-tech-highlights">
                {technologyHighlights.map(([Icon, title, description]) => <div className="mv-tech-highlight" key={title}><span className="mv-icon-box"><Icon size={18} /></span><div><strong>{title}</strong><span>{description}</span></div></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="mv-section mv-section-anchor mv-human-loop">
          <div className="mv-container mv-human-loop__grid">
            <div className="mv-human-loop__copy mv-reveal">
              <p className="mv-kicker">PHYSICIAN-FIRST BY DESIGN</p>
              <h2>Technology Supporting Human Expertise</h2>
              <p>AI can organize information and surface patterns. It cannot replace clinical context, examination, or professional judgment.</p>
              <ul className="mv-check-list">
                <li><CheckCircle2 size={18} /> AI assists physicians with structured findings</li>
                <li><CheckCircle2 size={18} /> Findings are recommendations for review</li>
                <li><CheckCircle2 size={18} /> Physicians remain responsible for interpretation</li>
              </ul>
            </div>
            <div className="mv-human-loop__card mv-glass-card mv-reveal mv-reveal--two"><div className="mv-orbit"><div className="mv-orbit__core"><HeartPulse size={31} /></div><span className="mv-orbit__node mv-orbit__node--one"><BrainCircuit size={18} /></span><span className="mv-orbit__node mv-orbit__node--two"><Stethoscope size={18} /></span></div><div><span className="mv-status-pill"><Check size={13} /> Human-in-the-loop</span><h3>Review. Interpret. Decide.</h3><p>Clinical expertise stays at the center of every assessment.</p></div></div>
          </div>
        </section>

        <section className="mv-disclaimer">
          <div className="mv-container"><div className="mv-disclaimer__inner"><ShieldCheck size={22} /><p><strong>Medical safety notice</strong> MedVision AI provides AI-assisted analysis for informational and clinical decision-support purposes. It is not a definitive diagnosis and should not replace professional medical judgment.</p></div></div>
        </section>

        <section className="mv-section mv-final-cta">
          <div className="mv-ambient mv-ambient--cta" />
          <div className="mv-container mv-final-cta__inner mv-reveal"><p className="mv-kicker">A MORE THOUGHTFUL REVIEW LOOP</p><h2>Join the Future of Radiology</h2><p>Experience a smarter, more organized approach to AI-assisted medical analysis.</p><div className="mv-hero__actions"><button type="button" className="mv-button mv-button--primary mv-button--large" onClick={() => navigate("/login")}>Get Started <ArrowRight size={18} /></button><button type="button" className="mv-button mv-button--outline mv-button--large" onClick={() => goTo("about")}>Contact Us</button></div></div>
        </section>
      </main>

      <footer id="contact" className="mv-footer">
        <div className="mv-container"><div className="mv-footer__top"><button className="mv-brand" type="button" onClick={() => goTo("home")}><span className="mv-brand__mark"><HeartPulse size={22} strokeWidth={2.3} /></span><span><strong>MedVision AI</strong><small>AI for a Healthier Tomorrow</small></span></button><p>AI-assisted medical imaging intelligence for physician review.</p><div className="mv-footer__links">{navItems.map(([label, id]) => <button key={id} type="button" onClick={() => goTo(id)}>{label}</button>)}<button type="button" onClick={() => goTo("contact")}>Contact</button></div></div><div className="mv-footer__bottom"><span>© {new Date().getFullYear()} MedVision AI. All rights reserved.</span><span>AI-assisted analysis · Human expertise first</span><span><button type="button">Privacy Policy</button><button type="button">Terms of Service</button></span></div></div>
      </footer>
    </div>
  );
}

function TrustItem({ icon: Icon, label }) {
  return <div className="mv-trust-item"><span className="mv-trust-item__icon"><Icon size={18} /></span><span>{label}</span></div>;
}

function Stat({ value, label }) {
  return <div className="mv-stat"><strong>{value}</strong><span>{label}</span></div>;
}

function SectionHeading({ kicker, title, subtitle, centered = false }) {
  return <div className={`mv-section-heading ${centered ? "mv-section-heading--centered" : ""}`}><p className="mv-kicker">{kicker}</p><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>;
}

function RadiologyVisual({ variant = "hero" }) {
  return <div className={`mv-radiology-visual mv-radiology-visual--${variant}`}><div className="mv-xray-frame"><div className="mv-xray-glow" /><div className="mv-scan-line" /><div className="mv-xray"><div className="mv-xray__spine" /><div className="mv-xray__lung mv-xray__lung--left" /><div className="mv-xray__lung mv-xray__lung--right" /><div className="mv-xray__ribs" /></div><div className="mv-frame-corner mv-frame-corner--tl" /><div className="mv-frame-corner mv-frame-corner--tr" /><div className="mv-frame-corner mv-frame-corner--bl" /><div className="mv-frame-corner mv-frame-corner--br" /></div><div className="mv-float-card mv-float-card--analysis"><div className="mv-float-card__title"><BrainCircuit size={15} /> AI Analysis</div><div className="mv-complete"><CheckCircle2 size={15} /> Complete</div></div><div className="mv-float-card mv-float-card--condition"><span>Detected Condition</span><strong><Activity size={15} /> Pneumonia</strong><small>Confidence: 87%</small></div><div className="mv-float-card mv-float-card--findings"><strong>AI Findings</strong><Finding name="Pneumonia" value="87%" active /><Finding name="Effusion" value="12%" /><Finding name="Atelectasis" value="8%" /><Finding name="Cardiomegaly" value="3%" /></div><div className="mv-visual-note">Technology<br />supporting<br /><em>human expertise</em></div></div>;
}

function Finding({ name, value, active = false }) {
  return <div className={`mv-finding ${active ? "mv-finding--active" : ""}`}><span><i />{name}</span><b>{value}</b></div>;
}

function ClinicalMonitorVisual() {
  return <div className="mv-monitor-visual"><div className="mv-monitor-visual__screen"><div className="mv-mini-xray"><div className="mv-mini-xray__spine" /><div className="mv-mini-xray__lung mv-mini-xray__lung--left" /><div className="mv-mini-xray__lung mv-mini-xray__lung--right" /></div><div className="mv-monitor-panel"><span>AI findings</span><b>Review required</b><div /><div /><div /></div></div><span className="mv-monitor-visual__stand" /></div>;
}

function TechnologyVisual() {
  return <div className="mv-tech-visual"><div className="mv-tech-visual__images"><div className="mv-tech-xray"><div className="mv-xray__spine" /><div className="mv-xray__lung mv-xray__lung--left" /><div className="mv-xray__lung mv-xray__lung--right" /></div><div className="mv-tech-xray mv-tech-xray--highlight"><span className="mv-hotspot" /></div></div><div className="mv-probability-card"><div><strong>AI prediction</strong><span>Illustrative demo</span></div><div className="mv-probability"><span>Pneumonia</span><b>87%</b><i style={{ "--bar": "87%" }} /></div><div className="mv-probability"><span>Effusion</span><b>12%</b><i style={{ "--bar": "12%" }} /></div><div className="mv-probability"><span>Other findings</span><b>08%</b><i style={{ "--bar": "8%" }} /></div></div></div>;
}
