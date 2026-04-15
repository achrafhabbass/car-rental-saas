'use client';

import {
  Building2,
  Car,
  CreditCard,
  Gauge,
  FileBadge,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/table';
import type { ClientDto, VehicleDto } from '@autosphere/shared';

interface PartiesCardProps {
  client: ClientDto | null;
  vehicle: VehicleDto | null;
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="text-slate-900 truncate">{children || '—'}</p>
      </div>
    </div>
  );
}

export function PartiesCard({ client, vehicle }: PartiesCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {client?.type === 'COMPANY' ? (
              <Building2 className="h-4 w-4 text-primary-500" />
            ) : (
              <User className="h-4 w-4 text-primary-500" />
            )}
            Client
          </CardTitle>
          {client && (
            <div className="flex items-center gap-1.5">
              {client.blacklisted && <Badge tone="red">Blacklisté</Badge>}
              <Badge
                tone={
                  client.segment === 'VIP'
                    ? 'amber'
                    : client.segment === 'AT_RISK'
                      ? 'red'
                      : client.segment === 'REGULAR'
                        ? 'blue'
                        : 'slate'
                }
              >
                {client.segment}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardBody className="space-y-3">
          {client ? (
            <>
              <Link
                href={`/clients/${client.id}`}
                className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 hover:text-secondary hover:underline underline-offset-2"
              >
                {client.type === 'COMPANY' && client.companyName
                  ? client.companyName
                  : client.fullName}
              </Link>
              {client.type === 'COMPANY' && client.companyName && (
                <p className="text-xs text-slate-500 -mt-2">
                  Représentant : {client.fullName}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <Row icon={Phone} label="Téléphone">
                  {client.phone ? (
                    <a
                      href={`tel:${client.phone}`}
                      className="hover:text-secondary hover:underline"
                    >
                      {client.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </Row>
                <Row icon={Mail} label="Email">
                  {client.email ? (
                    <a
                      href={`mailto:${client.email}`}
                      className="hover:text-secondary hover:underline"
                    >
                      {client.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </Row>
                <Row icon={FileBadge} label="N° identifiant">
                  {client.idNumber}
                  {client.idType ? ` · ${client.idType}` : ''}
                </Row>
                <Row icon={CreditCard} label="N° permis">
                  {client.licenseNumber ?? '—'}
                </Row>
                <Row icon={MapPin} label="Adresse">
                  {[client.addressLine1, client.city, client.country]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </Row>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Client introuvable.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-4 w-4 text-primary-500" />
            Véhicule
          </CardTitle>
          {vehicle && (
            <Badge
              tone={
                vehicle.status === 'AVAILABLE'
                  ? 'green'
                  : vehicle.status === 'RENTED'
                    ? 'blue'
                    : vehicle.status === 'MAINTENANCE'
                      ? 'amber'
                      : 'slate'
              }
            >
              {vehicle.status}
            </Badge>
          )}
        </CardHeader>
        <CardBody className="space-y-3">
          {vehicle ? (
            <>
              <div className="flex items-center justify-between">
                <Link
                  href={`/vehicles/${vehicle.id}`}
                  className="text-base font-semibold text-slate-900 hover:text-secondary hover:underline underline-offset-2"
                >
                  {vehicle.brand} {vehicle.model}
                </Link>
                <span className="inline-flex items-center rounded-md bg-slate-900 text-white text-xs font-bold px-2 py-0.5 tracking-wide">
                  {vehicle.registration}
                </span>
              </div>
              <p className="text-xs text-slate-500 -mt-2">
                {vehicle.year} · {vehicle.color ?? '—'}
                {vehicle.category ? ` · ${vehicle.category}` : ''}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <Row icon={Gauge} label="Kilométrage">
                  {vehicle.currentKm.toLocaleString('fr-FR')} km
                </Row>
                <Row icon={CreditCard} label="Tarif journalier">
                  {Number(vehicle.dailyRate).toFixed(2)} MAD
                </Row>
                <Row icon={FileBadge} label="Transmission / Carburant">
                  {vehicle.transmission} · {vehicle.fuel}
                </Row>
                <Row icon={User} label="Places">
                  {vehicle.seats}
                </Row>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Véhicule introuvable.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
