'use client';

import {
  Ban,
  CheckCircle2,
  Copy,
  KeyRound,
  Plus,
  RotateCcw,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { usersApi } from '@/lib/resources';
import { useToast } from '@/lib/toast-context';
import type { UserDto, UserRoleName } from '@autosphere/shared';

const ROLE_TONE: Record<string, 'blue' | 'amber' | 'green' | 'slate'> = {
  ADMIN: 'blue',
  MANAGER: 'amber',
  EMPLOYEE: 'green',
  ACCOUNTANT: 'slate',
};

const STATUS_TONE: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'slate'> = {
  ACTIVE: 'green',
  INVITED: 'blue',
  SUSPENDED: 'amber',
  DISABLED: 'red',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employé',
  ACCOUNTANT: 'Comptable',
};

function formatDate(iso: string | null): string {
  if (!iso) return 'Jamais';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function TeamPage() {
  const { hasRole, user: me } = useAuth();
  const toast = useToast();
  const isAdmin = hasRole('ADMIN');

  const [users, setUsers] = useState<UserDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Create form
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRoleName>('EMPLOYEE');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteName = users.find((u) => u.id === deleteId);

  const load = useCallback(() => {
    usersApi
      .list()
      .then(setUsers)
      .catch((err) => {
        if (err instanceof ApiError) setError(err.message);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser() {
    setBusy(true);
    try {
      const result = await usersApi.create({
        email,
        firstName,
        lastName,
        role,
      });
      toast.success(
        'Utilisateur créé',
        result.tempPassword
          ? `Mot de passe temporaire : ${result.tempPassword}`
          : 'Compte créé avec succès',
      );
      if (result.tempPassword) {
        setTempPassword(result.tempPassword);
      }
      setCreateOpen(false);
      setEmail('');
      setFirstName('');
      setLastName('');
      setRole('EMPLOYEE');
      load();
    } catch (err) {
      toast.error('Échec', err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(userId: string, newRole: string) {
    try {
      await usersApi.update(userId, { role: newRole });
      toast.success('Rôle mis à jour');
      load();
    } catch (err) {
      toast.error('Échec', err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function toggleStatus(userId: string, current: string) {
    const newStatus = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await usersApi.update(userId, { status: newStatus });
      toast.success(newStatus === 'ACTIVE' ? 'Utilisateur activé' : 'Utilisateur suspendu');
      load();
    } catch (err) {
      toast.error('Échec', err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function doDelete() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await usersApi.delete(deleteId);
      toast.success('Utilisateur supprimé');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error('Échec', err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(userId: string) {
    try {
      const result = await usersApi.resetPassword(userId);
      setTempPassword(result.newPassword);
      toast.success('Mot de passe réinitialisé', `Nouveau : ${result.newPassword}`);
    } catch (err) {
      toast.error('Échec', err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Équipe"
        description={`${users.length} membre${users.length > 1 ? 's' : ''} dans votre organisation`}
        actions={
          isAdmin ? (
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Inviter un membre
            </Button>
          ) : undefined
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Temp password display */}
      {tempPassword && (
        <Card>
          <CardBody className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl">
            <KeyRound className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                Mot de passe temporaire
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Partagez ce mot de passe avec l'utilisateur. Il devra le changer à sa première connexion.
              </p>
              <code className="mt-2 block bg-white rounded px-3 py-2 font-mono text-sm text-slate-900 border border-amber-200">
                {tempPassword}
              </code>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(tempPassword);
                toast.success('Copié');
              }}
            >
              <Copy className="h-4 w-4" />
              Copier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTempPassword(null)}
            >
              Fermer
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Create form */}
      {createOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary-500" />
              Inviter un nouveau membre
            </CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Prénom" htmlFor="uFirst" required>
              <Input
                id="uFirst"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </Field>
            <Field label="Nom" htmlFor="uLast" required>
              <Input
                id="uLast"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </Field>
            <Field label="Email" htmlFor="uEmail" required>
              <Input
                id="uEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="membre@entreprise.ma"
              />
            </Field>
            <Field label="Rôle" htmlFor="uRole">
              <Select
                id="uRole"
                value={role}
                onChange={(e) => {
                  const v = e.target.value as UserRoleName;
                  setRole(v);
                }}
              >
                <option value="EMPLOYEE">Employé</option>
                <option value="MANAGER">Manager</option>
                <option value="ACCOUNTANT">Comptable</option>
                <option value="ADMIN">Administrateur</option>
              </Select>
            </Field>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={createUser}
                loading={busy}
                disabled={!email || !firstName || !lastName}
              >
                <Plus className="h-4 w-4" />
                Créer et générer le mot de passe
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary-500" />
            Membres de l'équipe
          </CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th>Nom</Th>
                <Th>Email</Th>
                <Th>Rôle</Th>
                <Th>Statut</Th>
                <Th>Dernière connexion</Th>
                {isAdmin && <Th>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {users.length === 0 ? (
                <Tr>
                  <Td colSpan={6} className="text-center text-slate-400 py-8">
                    Aucun membre dans l'équipe.
                  </Td>
                </Tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === me?.id;
                  return (
                    <Tr key={u.id}>
                      <Td>
                        <div>
                          <p className="font-medium text-slate-900">
                            {u.firstName} {u.lastName}
                          </p>
                          {isSelf && (
                            <span className="text-[10px] text-primary-500 font-semibold">
                              (vous)
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td className="text-slate-500">{u.email}</Td>
                      <Td>
                        {isAdmin && !isSelf ? (
                          <Select
                            value={u.role}
                            onChange={(e) => {
                              const v = e.target.value;
                              changeRole(u.id, v);
                            }}
                            className="text-xs h-7 w-32"
                          >
                            <option value="EMPLOYEE">Employé</option>
                            <option value="MANAGER">Manager</option>
                            <option value="ACCOUNTANT">Comptable</option>
                            <option value="ADMIN">Admin</option>
                          </Select>
                        ) : (
                          <Badge tone={ROLE_TONE[u.role] ?? 'slate'}>
                            {ROLE_LABELS[u.role] ?? u.role}
                          </Badge>
                        )}
                      </Td>
                      <Td>
                        <Badge tone={STATUS_TONE[u.status] ?? 'slate'}>
                          {u.status}
                        </Badge>
                      </Td>
                      <Td className="text-sm text-slate-500 whitespace-nowrap">
                        {formatDate(u.lastLoginAt)}
                      </Td>
                      {isAdmin && (
                        <Td>
                          {!isSelf && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStatus(u.id, u.status)}
                                title={u.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                              >
                                {u.status === 'ACTIVE' ? (
                                  <Ban className="h-3.5 w-3.5 text-amber-500" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resetPassword(u.id)}
                                title="Réinitialiser le mot de passe"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(u.id)}
                                title="Supprimer"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </Td>
                      )}
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer cet utilisateur ?"
        description={
          <span>
            <strong>
              {deleteName?.firstName} {deleteName?.lastName}
            </strong>{' '}
            sera désactivé et ne pourra plus se connecter. Cette action peut être annulée.
          </span>
        }
        tone="danger"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        loading={busy}
        onConfirm={doDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
