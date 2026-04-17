'use client';

import Link from 'next/link';
import { Building2, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { platformApi } from '@/lib/resources';
import { useToast } from '@/lib/toast-context';
import type { TenantDto, TenantStatusName } from '@autosphere/shared';

const STATUS_TONE: Record<TenantStatusName, 'green' | 'amber' | 'red' | 'slate' | 'blue'> = {
  ACTIVE: 'green',
  TRIAL: 'blue',
  SUSPENDED: 'amber',
  EXPIRED: 'red',
  CANCELLED: 'slate',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function PlatformTenantsPage() {
  const toast = useToast();
  const [items, setItems] = useState<TenantDto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [createOpen, setCreateOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    platformApi
      .listTenants({
        status: status || undefined,
        plan: plan || undefined,
        q: q || undefined,
        pageSize: 100,
      })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, [status, plan, q]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function createTenant() {
    if (!companyName || !firstName || !lastName || !email || !password) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }
    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setCreating(true);
    try {
      await platformApi.createTenant({
        companyName,
        companySlug: slugify(companyName) || 'company',
        firstName,
        lastName,
        email,
        password,
      });
      toast.success(
        'Client créé avec succès',
        `${companyName} · ${email} · mot de passe : ${password}`,
      );
      setCreateOpen(false);
      setCompanyName('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      load();
    } catch (err) {
      toast.error(
        'Création échouée',
        err instanceof ApiError ? err.message : 'Erreur inconnue',
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Tenants"
        description={`${total} entreprise${total > 1 ? 's' : ''} sur la plateforme`}
        actions={
          <Button onClick={() => setCreateOpen((v) => !v)}>
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create tenant form */}
      {createOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary-500" />
              Créer un nouveau client
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-xs text-slate-500">
              Cela crée une nouvelle entreprise (tenant) avec un compte administrateur.
              Le client pourra se connecter immédiatement avec les identifiants ci-dessous.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Nom de l'entreprise" htmlFor="cCompany" required>
                  <Input
                    id="cCompany"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="Ex: Giyu Location"
                  />
                </Field>
              </div>
              <Field label="Prénom de l'admin" htmlFor="cFirst" required>
                <Input
                  id="cFirst"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Achraf"
                />
              </Field>
              <Field label="Nom de l'admin" htmlFor="cLast" required>
                <Input
                  id="cLast"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Habbass"
                />
              </Field>
              <Field label="Email" htmlFor="cEmail" required>
                <Input
                  id="cEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@entreprise.ma"
                />
              </Field>
              <Field label="Mot de passe" htmlFor="cPass" required hint="8 caractères minimum">
                <Input
                  id="cPass"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="MotDePasse123!"
                />
              </Field>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              Le mot de passe est affiché en clair pour que vous puissiez le partager au client.
              Le tenant sera créé en mode <strong>TRIAL (14 jours)</strong> avec le plan <strong>STARTER</strong>.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={createTenant}
                loading={creating}
                disabled={!companyName || !email || !password}
              >
                <Plus className="h-4 w-4" />
                Créer le client
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filters + table */}
      <Card>
        <div className="p-5 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Recherche" htmlFor="q">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="q"
                className="pl-9"
                placeholder="Nom, slug, email de facturation"
                value={q}
                onChange={(e) => setQ(e.currentTarget.value)}
              />
            </div>
          </Field>
          <Field label="Statut" htmlFor="f-status">
            <Select
              id="f-status"
              value={status}
              onChange={(e) => setStatus(e.currentTarget.value)}
            >
              <option value="">Tous</option>
              <option value="TRIAL">Essai</option>
              <option value="ACTIVE">Actif</option>
              <option value="SUSPENDED">Suspendu</option>
              <option value="EXPIRED">Expiré</option>
              <option value="CANCELLED">Résilié</option>
            </Select>
          </Field>
          <Field label="Plan" htmlFor="f-plan">
            <Select id="f-plan" value={plan} onChange={(e) => setPlan(e.currentTarget.value)}>
              <option value="">Tous</option>
              <option value="STARTER">Starter</option>
              <option value="BUSINESS">Business</option>
              <option value="ENTERPRISE">Enterprise</option>
            </Select>
          </Field>
        </div>

        <Table>
          <Thead>
            <Tr>
              <Th>Nom</Th>
              <Th>Slug</Th>
              <Th>Plan</Th>
              <Th>Statut</Th>
              <Th>Essai</Th>
              <Th>Fin abo</Th>
              <Th>Créé</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items === null ? (
              <Tr>
                <Td colSpan={7} className="text-center text-slate-400 py-8">
                  Chargement…
                </Td>
              </Tr>
            ) : items.length === 0 ? (
              <Tr>
                <Td colSpan={7} className="text-center text-slate-400 py-8">
                  Aucun tenant ne correspond aux filtres.
                </Td>
              </Tr>
            ) : (
              items.map((t) => (
                <Tr key={t.id}>
                  <Td>
                    <Link
                      href={`/platform/tenants/${t.id}`}
                      className="font-medium text-slate-900 hover:text-primary-500"
                    >
                      {t.name}
                    </Link>
                  </Td>
                  <Td className="font-mono text-xs text-slate-500">{t.slug}</Td>
                  <Td>
                    <Badge tone="blue">{t.plan}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[t.status] ?? 'slate'}>{t.status}</Badge>
                  </Td>
                  <Td>{formatDate(t.trialEndsAt)}</Td>
                  <Td>{formatDate(t.subscriptionEnd)}</Td>
                  <Td>{formatDate(t.createdAt)}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
