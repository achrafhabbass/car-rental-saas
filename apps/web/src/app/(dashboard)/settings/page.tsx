'use client';

import {
  Building2,
  Globe,
  KeyRound,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/lib/resources';
import { useToast } from '@/lib/toast-context';

const PREFS_KEY = 'autosphere:prefs';

interface LocalPrefs {
  language: 'fr' | 'en' | 'ar';
  currency: 'MAD' | 'EUR' | 'USD';
  timezone: string;
}

const DEFAULT_PREFS: LocalPrefs = {
  language: 'fr',
  currency: 'MAD',
  timezone: 'Africa/Casablanca',
};

function loadPrefs(): LocalPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<LocalPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function SectionNav({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  const items = [
    { id: 'company', label: 'Entreprise', icon: Building2 },
    { id: 'profile', label: 'Compte utilisateur', icon: UserCog },
    { id: 'prefs', label: 'Préférences', icon: Globe },
    { id: 'security', label: 'Sécurité', icon: ShieldCheck },
  ];
  return (
    <nav className="sticky top-4 space-y-1">
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = active === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-primary-500' : 'text-slate-400'}`} />
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, refreshUser, logout } = useAuth();

  const [section, setSection] = useState<'company' | 'profile' | 'prefs' | 'security'>(
    'profile',
  );

  // Profile
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  // Preferences
  const [prefs, setPrefs] = useState<LocalPrefs>(DEFAULT_PREFS);
  useEffect(() => setPrefs(loadPrefs()), []);

  // Logout-all
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  const pwMismatch = useMemo(
    () => confirmPassword.length > 0 && confirmPassword !== newPassword,
    [confirmPassword, newPassword],
  );

  async function onSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authApi.updateMe({ firstName, lastName });
      await refreshUser();
      toast.success('Profil mis à jour');
    } catch (err) {
      toast.error(
        'Échec de la mise à jour',
        err instanceof ApiError ? err.message : 'Erreur inconnue',
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pwMismatch) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setChanging(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success(
        'Mot de passe modifié',
        'Vos autres sessions ont été déconnectées. Reconnectez-vous.',
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await logout();
      router.replace('/login');
    } catch (err) {
      toast.error(
        'Échec',
        err instanceof ApiError ? err.message : 'Erreur inconnue',
      );
    } finally {
      setChanging(false);
    }
  }

  function onSavePrefs() {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      toast.success('Préférences enregistrées');
    } catch {
      toast.error('Impossible d’enregistrer localement.');
    }
  }

  async function onLogoutAll() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/login');
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  }

  if (!user) {
    return <div className="text-sm text-slate-400">Chargement…</div>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Paramètres"
        description="Gérez votre compte, votre entreprise, vos préférences et votre sécurité."
      />

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className="md:block">
          <SectionNav active={section} onChange={(s) => setSection(s as typeof section)} />
        </aside>

        <div className="space-y-6">
          {section === 'company' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary-500" />
                  Informations de l'entreprise
                </CardTitle>
                {user.tenant && <Badge tone="blue">{user.tenant.status}</Badge>}
              </CardHeader>
              <CardBody className="space-y-5">
                {user.tenant ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Nom de l'entreprise" htmlFor="cName">
                        <Input id="cName" value={user.tenant.name} readOnly />
                      </Field>
                      <Field label="Identifiant (slug)" htmlFor="cSlug">
                        <Input id="cSlug" value={user.tenant.slug} readOnly />
                      </Field>
                      <Field label="Plan" htmlFor="cPlan">
                        <Input id="cPlan" value={user.tenant.plan ?? '—'} readOnly />
                      </Field>
                      <Field label="Statut" htmlFor="cStatus">
                        <Input id="cStatus" value={user.tenant.status} readOnly />
                      </Field>
                    </div>
                    <div className="rounded-lg bg-primary-50/60 border border-primary-100 p-3.5 text-xs text-primary-700">
                      La modification des informations de l'entreprise est gérée par
                      l'administrateur de la plateforme. Contactez le support si une mise à
                      jour est nécessaire.
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    Aucune entreprise rattachée à votre compte (super-administrateur).
                  </p>
                )}
              </CardBody>
            </Card>
          )}

          {section === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-primary-500" />
                  Compte utilisateur
                </CardTitle>
                <Badge tone="slate">{user.role}</Badge>
              </CardHeader>
              <CardBody>
                <form onSubmit={onSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Prénom" htmlFor="firstName" required>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.currentTarget.value)}
                        required
                        minLength={1}
                        maxLength={120}
                      />
                    </Field>
                    <Field label="Nom" htmlFor="lastName" required>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.currentTarget.value)}
                        required
                        minLength={1}
                        maxLength={120}
                      />
                    </Field>
                  </div>
                  <Field
                    label="Adresse email"
                    htmlFor="email"
                    hint="Contactez votre administrateur pour modifier votre email."
                  >
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      readOnly
                      className="bg-slate-50"
                    />
                  </Field>
                  <Field label="Rôle" htmlFor="role">
                    <Input id="role" value={user.role} readOnly className="bg-slate-50" />
                  </Field>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                      {user.lastLoginAt
                        ? `Dernière connexion : ${new Date(user.lastLoginAt).toLocaleString('fr-FR')}`
                        : 'Première session en cours.'}
                    </p>
                    <Button type="submit" loading={savingProfile}>
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {section === 'prefs' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary-500" />
                  Préférences système
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Langue" htmlFor="lang">
                    <Select
                      id="lang"
                      value={prefs.language}
                      onChange={(e) => {
                        const value = e.target.value as LocalPrefs['language'];
                        setPrefs((p) => ({ ...p, language: value }));
                      }}
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </Select>
                  </Field>
                  <Field label="Devise" htmlFor="cur">
                    <Select
                      id="cur"
                      value={prefs.currency}
                      onChange={(e) => {
                        const value = e.target.value as LocalPrefs['currency'];
                        setPrefs((p) => ({ ...p, currency: value }));
                      }}
                    >
                      <option value="MAD">MAD · Dirham marocain</option>
                      <option value="EUR">EUR · Euro</option>
                      <option value="USD">USD · Dollar</option>
                    </Select>
                  </Field>
                  <Field label="Fuseau horaire" htmlFor="tz">
                    <Select
                      id="tz"
                      value={prefs.timezone}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPrefs((p) => ({ ...p, timezone: value }));
                      }}
                    >
                      <option value="Africa/Casablanca">Casablanca (GMT+1)</option>
                      <option value="Europe/Paris">Paris (GMT+1/+2)</option>
                      <option value="Europe/Madrid">Madrid (GMT+1/+2)</option>
                      <option value="UTC">UTC</option>
                    </Select>
                  </Field>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600">
                  Ces préférences sont enregistrées localement sur cet appareil.
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <Button onClick={onSavePrefs}>
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {section === 'security' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary-500" />
                    Changer le mot de passe
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <form onSubmit={onChangePassword} className="space-y-5">
                    <Field label="Mot de passe actuel" htmlFor="curPw" required>
                      <Input
                        id="curPw"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.currentTarget.value)}
                        required
                        autoComplete="current-password"
                      />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field
                        label="Nouveau mot de passe"
                        htmlFor="newPw"
                        hint="8 caractères minimum."
                        required
                      >
                        <Input
                          id="newPw"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.currentTarget.value)}
                          required
                          minLength={8}
                          autoComplete="new-password"
                        />
                      </Field>
                      <Field
                        label="Confirmer le nouveau mot de passe"
                        htmlFor="confirmPw"
                        error={pwMismatch ? 'Les mots de passe ne correspondent pas.' : undefined}
                        required
                      >
                        <Input
                          id="confirmPw"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                          required
                          minLength={8}
                          autoComplete="new-password"
                        />
                      </Field>
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800">
                      Après modification, toutes vos sessions seront déconnectées et vous
                      serez redirigé vers la page de connexion.
                    </div>
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <Button type="submit" loading={changing} disabled={pwMismatch}>
                        <KeyRound className="h-4 w-4" />
                        Mettre à jour
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-primary-500" />
                    Sessions actives
                  </CardTitle>
                </CardHeader>
                <CardBody className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-700">
                      Déconnectez-vous de tous les appareils et navigateurs où vous êtes
                      connecté, y compris celui-ci.
                    </p>
                    <p className="text-xs text-slate-400 mt-1 inline-flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> {user.email}
                    </p>
                  </div>
                  <Button variant="danger" onClick={() => setLogoutOpen(true)}>
                    <LogOut className="h-4 w-4" />
                    Se déconnecter partout
                  </Button>
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        title="Se déconnecter de toutes les sessions ?"
        description="Toutes vos sessions actives seront fermées. Vous devrez vous reconnecter sur chaque appareil."
        tone="danger"
        confirmLabel="Oui, se déconnecter"
        cancelLabel="Annuler"
        loading={loggingOut}
        onConfirm={onLogoutAll}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
}
