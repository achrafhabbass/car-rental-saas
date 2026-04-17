'use client';

import {
  ArrowRight,
  BarChart3,
  Car,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe,
  Mail,
  Phone,
  Send,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';

const PRIMARY = '#1B3A6B';
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
    price: 499,
    period: '/mois',
    desc: 'Idéal pour démarrer',
    features: ['10 véhicules', '3 utilisateurs', 'Réservations & contrats', 'Facturation de base', 'Alertes maintenance'],
    cta: 'Commencer l\'essai',
    popular: false,
  },
  {
    name: 'Standard',
    price: 999,
    period: '/mois',
    desc: 'Pour les agences en croissance',
    features: ['50 véhicules', '10 utilisateurs', 'Tout Basic +', 'Rapports avancés', 'Inspections', 'Export PDF & Excel'],
    cta: 'Essai gratuit 14j',
    popular: true,
  },
  {
    name: 'Premium',
    price: 2499,
    period: '/mois',
    desc: 'Pour les grandes agences',
    features: ['Véhicules illimités', 'Utilisateurs illimités', 'Tout Standard +', 'API & intégrations', 'Support prioritaire', 'Multi-agences'],
    cta: 'Contacter l\'équipe',
    popular: false,
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
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <DemoSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

// ─── Navbar ───

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            A
          </div>
          <span className="font-bold text-lg text-slate-900">AutoSphere</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-slate-900 transition">Tarifs</a>
          <a href="#demo" className="hover:text-slate-900 transition">Démo</a>
          <a href="#contact" className="hover:text-slate-900 transition">Contact</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition hidden sm:block">
            Connexion
          </Link>
          <Link
            href="#demo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-primary-600 transition"
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
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50" />
      <div className="absolute top-20 -right-32 w-[500px] h-[500px] rounded-full bg-primary-500/5 blur-3xl" />
      <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-700 ring-1 ring-primary-100 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Plateforme SaaS #1 au Maroc
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Gérez votre{' '}
            <span className="bg-gradient-to-r from-primary-500 to-secondary bg-clip-text text-transparent">
              agence de location
            </span>{' '}
            sans effort
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
            Flotte, réservations, contrats, facturation, analytics — tout en un.
            AutoSphere automatise votre activité pour que vous puissiez vous concentrer sur la croissance.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-4">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 hover:bg-primary-600 transition"
            >
              Réserver une démo
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 transition"
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
            className="rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/60 p-1 overflow-hidden"
            style={{ transform: 'rotateY(-4deg) rotateX(2deg)' }}
          >
            <div className="rounded-xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-auto text-[10px] text-white/50">dashboard.autosphere.ma</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { k: 'Véhicules', v: '124' },
                  { k: 'Contrats', v: '37' },
                  { k: 'CA mois', v: '89k' },
                  { k: 'Occupation', v: '78%' },
                ].map((s) => (
                  <div key={s.k} className="rounded-lg bg-white/10 px-2.5 py-2">
                    <p className="text-[9px] uppercase tracking-wider text-white/60">{s.k}</p>
                    <p className="text-lg font-bold">{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-1 h-20">
                {[40, 65, 48, 82, 58, 90, 72, 95, 68, 84, 58, 78].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-white/40 to-white/15" style={{ height: `${h}%` }} />
                ))}
              </div>
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
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {PLANS.map((p) => (
            <motion.div
              key={p.name}
              variants={fadeUp}
              className={`relative rounded-2xl p-7 ${
                p.popular
                  ? 'bg-primary-500 text-white ring-4 ring-primary-500/20 shadow-xl scale-[1.03]'
                  : 'bg-white ring-1 ring-slate-200 shadow-sm'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                  Populaire
                </span>
              )}
              <p className={`text-sm font-semibold uppercase tracking-wider ${p.popular ? 'text-primary-100' : 'text-slate-500'}`}>
                {p.name}
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{p.price}</span>
                <span className={`text-sm ${p.popular ? 'text-primary-200' : 'text-slate-500'}`}>
                  MAD{p.period}
                </span>
              </div>
              <p className={`mt-2 text-sm ${p.popular ? 'text-primary-100' : 'text-slate-500'}`}>
                {p.desc}
              </p>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${p.popular ? 'text-emerald-300' : 'text-emerald-500'}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="#demo"
                className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                  p.popular
                    ? 'bg-white text-primary-700 hover:bg-primary-50 shadow-md'
                    : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md'
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
                  <input required value={form.fullName} onChange={set('fullName')} className="w-full rounded-lg bg-white/10 ring-1 ring-white/20 px-3.5 py-2.5 text-sm placeholder:text-white/40 focus:ring-2 focus:ring-white/40 focus:outline-none" placeholder="Achraf Habbass" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-primary-200 mb-1.5">Email *</label>
                  <input required type="email" value={form.email} onChange={set('email')} className="w-full rounded-lg bg-white/10 ring-1 ring-white/20 px-3.5 py-2.5 text-sm placeholder:text-white/40 focus:ring-2 focus:ring-white/40 focus:outline-none" placeholder="vous@entreprise.ma" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-primary-200 mb-1.5">Téléphone</label>
                  <input value={form.phone} onChange={set('phone')} className="w-full rounded-lg bg-white/10 ring-1 ring-white/20 px-3.5 py-2.5 text-sm placeholder:text-white/40 focus:ring-2 focus:ring-white/40 focus:outline-none" placeholder="+212 6 00 00 00 00" />
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
          <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> +212 6 00 00 00 00</span>
          <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Données sécurisées</span>
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
