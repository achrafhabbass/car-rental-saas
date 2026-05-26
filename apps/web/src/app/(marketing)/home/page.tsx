'use client';

import {
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  Building2,
  Car,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  Globe,
  Mail,
  Phone,
  Quote,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api/v1';

const FEATURES = [
  {
    icon: Car,
    title: 'Gestion de flotte',
    desc: 'Suivez vos véhicules en temps réel : disponibilité, kilométrage, assurances, maintenance.',
  },
  {
    icon: FileText,
    title: 'Réservations & contrats',
    desc: 'Créez des réservations, convertissez-les en contrats, générez des PDFs professionnels.',
  },
  {
    icon: CreditCard,
    title: 'Facturation & paiements',
    desc: 'Factures automatiques, suivi des paiements, gestion des impayés et des crédits.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & reporting',
    desc: 'Tableaux de bord interactifs, CA mensuel, taux d\'occupation, top véhicules.',
  },
  {
    icon: Users,
    title: 'Multi-utilisateurs & rôles',
    desc: 'Invitez votre équipe avec des rôles adaptés : Admin, Manager, Employé, Comptable.',
  },
  {
    icon: Globe,
    title: 'Multi-tenant SaaS',
    desc: 'Chaque agence a son espace isolé. Données sécurisées, accès contrôlé.',
  },
];

const PLANS = [
  {
    name: 'Basic',
    price: 3000,
    period: '/an',
    desc: 'Idéal pour démarrer',
    features: ['10 véhicules', '3 utilisateurs', 'Réservations & contrats', 'Facturation de base', 'Alertes maintenance'],
    cta: 'Commencer l\'essai',
    popular: false,
  },
  {
    name: 'Pro',
    price: 5000,
    period: '/an',
    desc: 'Pour les agences en croissance',
    features: ['50 véhicules', '10 utilisateurs', 'Tout Basic +', 'Rapports avancés', 'Inspections', 'Export PDF & Excel'],
    cta: 'Essai gratuit 14j',
    popular: true,
  },
];

// ─── Social-proof stats ─────────────────────────────────────────────
const STATS_BAR = [
  { value: '850+', label: 'Agences partenaires', icon: Building2 },
  { value: '12 000+', label: 'Contrats signés', icon: FileText },
  { value: '18 000+', label: 'Véhicules gérés', icon: Car },
  { value: '99,9%', label: 'Disponibilité', icon: Zap },
];

// ─── How it works — 4-step product journey ─────────────────────────
const STEPS = [
  {
    icon: Upload,
    title: 'Importez votre flotte',
    desc: 'Ajoutez vos véhicules en quelques clics, ou importez depuis un fichier Excel.',
  },
  {
    icon: FileText,
    title: 'Créez réservations & contrats',
    desc: 'Convertissez en un clic. PDF généré automatiquement avec signature électronique.',
  },
  {
    icon: BarChart3,
    title: 'Suivez paiements & rentabilité',
    desc: 'Tableau de bord temps réel : CA mensuel, taux d\'occupation, top véhicules.',
  },
  {
    icon: Bell,
    title: 'Maintenance & alertes',
    desc: 'Assurance, visite technique, vidange — ne ratez jamais une échéance.',
  },
];

// ─── Testimonials ──────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote:
      'On a divisé par 4 le temps passé sur les contrats. Plus de papier, plus de WhatsApp. Tout est centralisé et nos clients adorent la signature électronique.',
    name: 'Hassan El Amrani',
    role: 'Directeur · Atlas Tourisme',
    initials: 'HA',
    rating: 5,
  },
  {
    quote:
      'Le module crédits et financement est un game-changer. On voit exactement la rentabilité de chaque véhicule, mensualité par mensualité. Indispensable.',
    name: 'Karima Bennani',
    role: 'CEO · Sahara Excursions',
    initials: 'KB',
    featured: true,
    rating: 5,
  },
  {
    quote:
      'Migré depuis Excel en 2 jours. Le support est réactif et la plateforme est en français — ce qui change tout pour mon équipe.',
    name: 'Youssef Lahlou',
    role: 'Gérant · Voyages Tanger Med',
    initials: 'YL',
    rating: 5,
  },
];

// ─── FAQ ───────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'Combien de temps pour démarrer ?',
    a: "Moins de 30 minutes : créez votre compte, importez votre flotte (manuellement ou via Excel), et invitez votre équipe. Aucune installation, tout est dans votre navigateur.",
  },
  {
    q: 'Comment migrer mes données actuelles ?',
    a: "Nous fournissons un modèle Excel pour importer véhicules et clients en quelques minutes. Pour les agences plus complexes, notre équipe accompagne la migration gratuitement.",
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Chaque agence dispose de son espace isolé (architecture multi-tenant). Chiffrement TLS en transit, sauvegardes quotidiennes automatiques, et hébergement conforme RGPD.',
  },
  {
    q: "Que se passe-t-il après l'essai gratuit ?",
    a: "Vous choisissez un plan ou vous arrêtez — aucune carte bancaire n'est demandée au démarrage. Vos données restent accessibles 30 jours en cas de pause.",
  },
  {
    q: 'Y a-t-il des frais cachés ?',
    a: "Non. Le prix affiché est tout compris : utilisateurs, mises à jour, support, sauvegardes. Aucun frais d'installation, aucun frais par contrat.",
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, sans engagement. Vous pouvez annuler depuis vos paramètres en un clic, et exporter toutes vos données au format Excel ou PDF.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen text-ink overflow-x-hidden">
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQSection />
      <DemoSection />
      <FinalCTA />
      <ContactSection />
      <Footer />
    </div>
  );
}

// ─── Navbar ───

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b-0">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9 rounded-xl bg-grad-primary flex items-center justify-center text-white shadow-glow group-hover:shadow-elevated transition-shadow">
            <Car className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent-400 ring-2 ring-white animate-pulse-soft" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">AutoSphere</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-primary-600 transition-colors">Fonctionnalités</a>
          <a href="#how" className="hover:text-primary-600 transition-colors">Fonctionnement</a>
          <a href="#pricing" className="hover:text-primary-600 transition-colors">Tarifs</a>
          <a href="#testimonials" className="hover:text-primary-600 transition-colors">Avis</a>
          <a href="#faq" className="hover:text-primary-600 transition-colors">FAQ</a>
          <a href="#demo" className="hover:text-primary-600 transition-colors">Démo</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-700 hover:text-primary-600 transition-colors hidden sm:block"
          >
            Connexion
          </Link>
          <Link
            href="#demo"
            className="inline-flex items-center gap-1.5 rounded-xl bg-grad-primary px-4 py-2 text-sm font-semibold text-white shadow-glow hover:brightness-105 transition-all"
          >
            Essai gratuit
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ───

function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Mesh-gradient background — indigo + cyan + violet blooms anchor
          the hero in the brand palette without any flat color. */}
      <div className="absolute inset-0 bg-mesh-light" />
      <div className="absolute inset-0 bg-grid-slate opacity-[0.35]" />
      <div className="absolute top-20 -right-32 w-[500px] h-[500px] rounded-full bg-primary-500/10 blur-3xl animate-blob" />
      <div
        className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full bg-accent-400/15 blur-3xl animate-blob"
        style={{ animationDelay: '-6s' }}
      />

      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-700 ring-1 ring-primary-100 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Plateforme SaaS #1 au Maroc
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl lg:text-7xl font-medium tracking-[-0.035em] leading-[0.95]"
          >
            Gérez votre{' '}
            <span className="em-ember">agence de location</span>{' '}
            sans effort
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
            Flotte, réservations, contrats, facturation, analytics — tout en un.
            AutoSphere automatise votre activité pour que vous puissiez vous concentrer sur la croissance.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <a
              href="#demo"
              className="group inline-flex items-center gap-2 rounded-xl bg-grad-primary px-6 py-3.5 text-sm font-semibold text-white shadow-glow hover:brightness-105 transition-all"
            >
              Réserver une démo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white/80 backdrop-blur px-6 py-3.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-200/80 hover:bg-white hover:ring-primary-300 hover:shadow-soft transition-all"
            >
              Contacter un expert
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 flex items-center gap-6 text-xs text-slate-500">
            {['14 jours gratuits', 'Aucune CB requise', 'Support inclus'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* 3D-ish dashboard preview */}
        <motion.div
          initial={{ opacity: 0, x: 60, rotateY: -8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="hidden lg:block"
          style={{ perspective: '1200px' }}
        >
          <div
            className="rounded-3xl bg-white shadow-elevated ring-1 ring-slate-200/60 p-1.5 overflow-hidden"
            style={{ transform: 'rotateY(-4deg) rotateX(2deg)' }}
          >
            <div className="rounded-[1.25rem] bg-grad-navy p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white opacity-30 pointer-events-none" />
              <div className="relative flex items-center gap-2 mb-5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-auto text-[10px] font-medium text-white/60">
                  dashboard.autosphere.ma
                </span>
              </div>
              <div className="relative grid grid-cols-4 gap-2 mb-5">
                {[
                  { k: 'Véhicules', v: '124' },
                  { k: 'Contrats', v: '37' },
                  { k: 'CA mois', v: '89k' },
                  { k: 'Occupation', v: '78%' },
                ].map((s) => (
                  <div
                    key={s.k}
                    className="rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/15 px-2.5 py-2"
                  >
                    <p className="text-[9px] uppercase tracking-wider text-white/70 font-semibold">
                      {s.k}
                    </p>
                    <p className="text-lg font-extrabold tracking-tight">{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="relative flex items-end gap-1 h-20">
                {[40, 65, 48, 82, 58, 90, 72, 95, 68, 84, 58, 78].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-md bg-gradient-to-t from-accent-300/50 to-white/70 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="relative mt-3 text-[10px] uppercase tracking-wider text-white/60 font-semibold">
                Recettes · 12 derniers mois
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Features ───

function Features() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-wider text-primary-500">
            Fonctionnalités
          </motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 text-3xl lg:text-4xl font-extrabold tracking-tight">
            Tout ce dont vous avez besoin pour gérer votre flotte
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-slate-600">
            Une plateforme complète qui remplace vos tableurs, votre WhatsApp et vos carnets.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-100 hover:shadow-md hover:ring-slate-200 transition group"
            >
              <div className="h-11 w-11 rounded-xl bg-primary-50 flex items-center justify-center mb-5 group-hover:bg-primary-100 transition">
                <f.icon className="h-5 w-5 text-primary-500" />
              </div>
              <h3 className="font-bold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Pricing ───

function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-wider text-primary-500">
            Tarifs
          </motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 text-3xl lg:text-4xl font-extrabold tracking-tight">
            Des plans adaptés à chaque agence
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-slate-600">
            14 jours d'essai gratuit · Aucune carte bancaire · Annulez à tout moment
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        >
          {PLANS.map((p) => (
            <motion.div
              key={p.name}
              variants={fadeUp}
              className={`relative rounded-3xl p-7 transition-shadow ${
                p.popular
                  ? 'bg-grad-primary text-white shadow-glow scale-[1.03] overflow-hidden'
                  : 'bg-white/90 backdrop-blur ring-1 ring-slate-200/70 shadow-soft hover:shadow-elevated'
              }`}
            >
              {/* Decorative grid on the popular card. */}
              {p.popular && (
                <div className="absolute inset-0 bg-grid-white opacity-30 pointer-events-none rounded-3xl" />
              )}
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                  Populaire
                </span>
              )}
              <p className={`relative text-sm font-semibold uppercase tracking-wider ${p.popular ? 'text-primary-100' : 'text-primary-600'}`}>
                {p.name}
              </p>
              <div className="relative mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">{p.price.toLocaleString('fr-FR')}</span>
                <span className={`text-sm ${p.popular ? 'text-primary-100' : 'text-slate-500'}`}>
                  MAD{p.period}
                </span>
              </div>
              <p className={`relative mt-2 text-sm ${p.popular ? 'text-primary-100' : 'text-slate-500'}`}>
                {p.desc}
              </p>
              <ul className="relative mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${p.popular ? 'text-emerald-300' : 'text-emerald-500'}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="#demo"
                className={`relative mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                  p.popular
                    ? 'bg-white text-primary-700 hover:bg-primary-50 shadow-soft hover:shadow-elevated'
                    : 'bg-grad-primary text-white shadow-glow hover:brightness-105'
                }`}
              >
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Demo Section ───

function DemoSection() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', companyName: '', preferredDate: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/leads/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'envoi');
      setSubmitted(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section id="demo" className="py-24 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-wider text-primary-200">
            Démonstration
          </motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 text-3xl lg:text-4xl font-extrabold tracking-tight">
            Voyez AutoSphere en action
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-primary-100 leading-relaxed">
            Réservez une session personnalisée avec un expert. 30 minutes pour découvrir
            comment AutoSphere peut transformer votre agence.
          </motion.p>
          <motion.ul variants={fadeUp} className="mt-8 space-y-3">
            {[
              'Démo personnalisée selon votre activité',
              'Questions/réponses en direct',
              'Configuration guidée de votre compte',
              'Aucun engagement',
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-primary-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                {t}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          {submitted ? (
            <div className="rounded-2xl bg-white/10 backdrop-blur-lg ring-1 ring-white/20 p-10 text-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Demande envoyée !</h3>
              <p className="mt-2 text-primary-100 text-sm">
                Notre équipe vous contactera sous 24h pour planifier votre session.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="rounded-2xl bg-white/10 backdrop-blur-lg ring-1 ring-white/20 p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-primary-200 mb-1.5">Nom complet *</label>
                  <input required value={form.fullName} onChange={set('fullName')} className="w-full rounded-lg bg-white/10 ring-1 ring-white/20 px-3.5 py-2.5 text-sm placeholder:text-white/40 focus:ring-2 focus:ring-white/40 focus:outline-none" placeholder="Mohammed Alami" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-primary-200 mb-1.5">Email *</label>
                  <input required type="email" value={form.email} onChange={set('email')} className="w-full rounded-lg bg-white/10 ring-1 ring-white/20 px-3.5 py-2.5 text-sm placeholder:text-white/40 focus:ring-2 focus:ring-white/40 focus:outline-none" placeholder="vous@entreprise.ma" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-primary-200 mb-1.5">Téléphone</label>
                  <input value={form.phone} onChange={set('phone')} className="w-full rounded-lg bg-white/10 ring-1 ring-white/20 px-3.5 py-2.5 text-sm placeholder:text-white/40 focus:ring-2 focus:ring-white/40 focus:outline-none" placeholder="+212 6 61 51 66 06" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-primary-200 mb-1.5">Société</label>
                  <input value={form.companyName} onChange={set('companyName')} className="w-full rounded-lg bg-white/10 ring-1 ring-white/20 px-3.5 py-2.5 text-sm placeholder:text-white/40 focus:ring-2 focus:ring-white/40 focus:outline-none" placeholder="Giyu Location" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary-200 mb-1.5">Date souhaitée</label>
                <input type="date" value={form.preferredDate} onChange={set('preferredDate')} className="w-full rounded-lg bg-white/10 ring-1 ring-white/20 px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-white/40 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary-200 mb-1.5">Message (optionnel)</label>
                <textarea value={form.message} onChange={set('message')} rows={3} className="w-full rounded-lg bg-white/10 ring-1 ring-white/20 px-3.5 py-2.5 text-sm placeholder:text-white/40 focus:ring-2 focus:ring-white/40 focus:outline-none resize-none" placeholder="Parlez-nous de votre agence..." />
              </div>
              {error && <p className="text-red-300 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-primary-700 shadow-lg hover:bg-primary-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Envoi en cours…' : (
                  <>
                    <Send className="h-4 w-4" />
                    Réserver ma démo gratuite
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Contact ───

function ContactSection() {
  const [form, setForm] = useState({ fullName: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`${API}/leads/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      // Silent fail
    } finally {
      setSubmitting(false);
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section id="contact" className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-wider text-primary-500">Contact</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-extrabold tracking-tight">
            Une question ? Contactez-nous
          </motion.h2>
        </motion.div>

        {submitted ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold">Message envoyé !</h3>
            <p className="mt-2 text-slate-500 text-sm">Nous vous répondrons sous 24h.</p>
          </div>
        ) : (
          <motion.form initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} onSubmit={onSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom complet *</label>
                <input required value={form.fullName} onChange={set('fullName')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email *</label>
                <input required type="email" value={form.email} onChange={set('email')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Message *</label>
              <textarea required value={form.message} onChange={set('message')} rows={5} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none resize-none" />
            </div>
            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-primary-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              {submitting ? 'Envoi…' : 'Envoyer le message'}
            </button>
          </motion.form>
        )}

        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-slate-500">
          <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> contact@autosphere.ma</span>
          <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> +212 6 61 51 66 06</span>
          <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Données sécurisées</span>
        </div>
      </div>
    </section>
  );
}

// ─── Stats bar — social proof right after the hero ───────────────────

function StatsBar() {
  return (
    <section className="relative py-12 lg:py-16 -mt-6 lg:-mt-8 z-10">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="rounded-3xl bg-paper border border-line shadow-elevated overflow-hidden"
        >
          <div className="h-1 bg-grad-primary" />
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-line-soft">
            {STATS_BAR.map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="px-6 py-7 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-primary-600 mb-2">
                  <s.icon className="h-4 w-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-mute">
                    {s.label}
                  </span>
                </div>
                <p className="font-display text-3xl lg:text-4xl font-medium tracking-tight text-ink leading-none">
                  {s.value}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── How it works — 4-step product journey ──────────────────────────

function HowItWorks() {
  return (
    <section id="how" className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.p variants={fadeUp} className="eyebrow mb-3 justify-center">
            Fonctionnement
          </motion.p>
          <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-medium tracking-tight">
            Démarrez en <span className="em-ember">4 étapes simples</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-ink-soft">
            Pas besoin d'installer quoi que ce soit. Tout passe par votre navigateur, depuis n'importe quel appareil.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div
            className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px border-t-2 border-dashed border-line"
            aria-hidden="true"
          />
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              variants={fadeUp}
              className="relative rounded-3xl bg-paper border border-line p-7 hover:shadow-elevated transition-shadow"
            >
              <div className="relative inline-flex items-center justify-center mb-5">
                <div className="h-12 w-12 rounded-2xl bg-grad-primary grid place-items-center shadow-glow text-white">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-paper border-2 border-line grid place-items-center font-mono text-[11px] font-bold text-primary-600">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display text-xl font-medium text-ink tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-soft leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────

function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 relative overflow-hidden">
      <div
        className="absolute top-0 -right-32 w-[500px] h-[500px] rounded-full bg-primary-500/6 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.p variants={fadeUp} className="eyebrow mb-3 justify-center">Témoignages</motion.p>
          <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-medium tracking-tight">
            Aimé par les <span className="em-ember">agences marocaines</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-ink-soft">
            Plus de 850 agences font confiance à AutoSphere pour gérer leur activité au quotidien.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className={`relative rounded-3xl p-7 transition-shadow ${
                t.featured
                  ? 'bg-grad-navy text-white shadow-glow lg:scale-[1.02]'
                  : 'bg-paper border border-line hover:shadow-elevated'
              }`}
            >
              {t.featured && (
                <>
                  <div
                    className="pointer-events-none absolute -top-1/4 -right-1/4 w-72 h-72 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(30,85,232,0.45), transparent 70%)' }}
                  />
                  <div className="absolute inset-0 bg-grid-white opacity-30 pointer-events-none rounded-3xl" aria-hidden="true" />
                </>
              )}
              <div className="relative">
                <Quote className={`h-7 w-7 ${t.featured ? 'text-primary-300' : 'text-primary-500'}`} />
                <div className="flex gap-0.5 mt-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-amber" />
                  ))}
                </div>
                <p className={`mt-4 text-[15px] leading-relaxed ${t.featured ? 'text-white/90' : 'text-ink'}`}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3 pt-5 border-t border-line/30">
                  <div className={`h-11 w-11 rounded-full grid place-items-center font-bold text-sm ${
                    t.featured ? 'bg-white/15 text-white' : 'bg-grad-primary text-white'
                  }`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${t.featured ? 'text-white' : 'text-ink'}`}>{t.name}</p>
                    <p className={`text-xs ${t.featured ? 'text-white/60' : 'text-ink-mute'}`}>{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-16 flex flex-wrap justify-center items-center gap-x-10 gap-y-4 text-ink-mute">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-5 w-5 text-emerald" />
            <span className="font-medium">RGPD conforme</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Award className="h-5 w-5 text-emerald" />
            <span className="font-medium">Hébergement Maroc & EU</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-5 w-5 text-emerald" />
            <span className="font-medium">Support 6j/7</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-5 w-5 text-emerald" />
            <span className="font-medium">99,9% uptime</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ────────────────────────────────────────────────────────────

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 lg:py-32 bg-cream-deep/40">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-14"
        >
          <motion.p variants={fadeUp} className="eyebrow mb-3 justify-center">FAQ</motion.p>
          <motion.h2 variants={fadeUp} className="font-display text-4xl lg:text-5xl font-medium tracking-tight">
            Vos questions, <span className="em-ember">nos réponses</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-3"
        >
          {FAQ_ITEMS.map((item, i) => {
            const open = openIndex === i;
            return (
              <motion.div
                key={item.q}
                variants={fadeUp}
                className="rounded-2xl bg-paper border border-line overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
                >
                  <span className="font-medium text-ink text-[15px] group-hover:text-primary-600 transition-colors">
                    {item.q}
                  </span>
                  <span className={`shrink-0 h-8 w-8 rounded-full grid place-items-center border transition-all ${
                    open ? 'bg-grad-primary border-transparent text-white rotate-180' : 'border-line text-ink-soft group-hover:border-primary-300'
                  }`}>
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>
                <div className={`grid transition-all duration-300 ease-out ${
                  open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-[14px] text-ink-soft leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <p className="mt-10 text-center text-sm text-ink-mute">
          Une autre question ?{' '}
          <a href="#contact" className="font-semibold text-primary-600 hover:underline underline-offset-4">
            Contactez notre équipe
          </a>
        </p>
      </div>
    </section>
  );
}

// ─── Final CTA banner ───────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div
          className="relative rounded-3xl overflow-hidden p-12 lg:p-16 text-center text-white shadow-elevated"
          style={{ background: 'linear-gradient(135deg, #161A2C 0%, #232843 100%)' }}
        >
          <div
            className="pointer-events-none absolute -top-1/3 -right-1/4 w-[500px] h-[500px]"
            style={{ background: 'radial-gradient(circle, rgba(30,85,232,0.55), transparent 70%)' }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-1/3 -left-1/4 w-[400px] h-[400px]"
            style={{ background: 'radial-gradient(circle, rgba(91,141,239,0.3), transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-grid-white opacity-20 pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 ring-1 ring-white/20 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary-300" />
              Commencez aujourd'hui
            </div>

            <h2 className="font-display text-4xl lg:text-6xl font-medium tracking-tight leading-[1.05]">
              Prêt à faire passer votre agence{' '}
              <span className="em-ember">au niveau supérieur</span> ?
            </h2>

            <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Rejoignez les 850+ agences qui ont digitalisé leur activité avec AutoSphere.
              14 jours d'essai gratuit, sans engagement.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a
                href="#demo"
                className="group inline-flex items-center gap-2 rounded-xl bg-grad-primary px-7 py-4 text-sm font-semibold text-white shadow-glow hover:brightness-105 transition-all"
              >
                Commencer l'essai gratuit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur px-7 py-4 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition-all"
              >
                Parler à un expert
              </a>
            </div>

            <div className="mt-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-white/55">
              {['14 jours gratuits', 'Aucune carte requise', 'Support inclus', 'Migration gratuite'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-300" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───

function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-primary-500 flex items-center justify-center font-bold text-sm">A</div>
              <span className="font-bold text-lg">AutoSphere</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Plateforme SaaS de gestion de location de voitures. Simplifiez votre activité.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Produit</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-white transition">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Tarifs</a></li>
              <li><a href="#demo" className="hover:text-white transition">Démo</a></li>
              <li><Link href="/login" className="hover:text-white transition">Connexion</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
              <li><a href="/api/docs" className="hover:text-white transition">Documentation API</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Légal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition">Conditions d'utilisation</a></li>
              <li><a href="#" className="hover:text-white transition">Politique de confidentialité</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} AutoSphere. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
