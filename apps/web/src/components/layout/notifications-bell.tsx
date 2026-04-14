'use client';

import { Bell, Check, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/lib/api';
import { notificationsApi } from '@/lib/resources';
import { cn } from '@/lib/utils';
import type { NotificationDto } from '@autosphere/shared';

/// Polling interval for fresh notifications. 30s is a fair balance between
/// freshness and load; in production you'd upgrade to SSE/WebSocket.
const POLL_MS = 30_000;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'à l\u2019instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export function NotificationsBell() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([
        notificationsApi.list({ limit: 15 }),
        notificationsApi.summary(),
      ]);
      setItems(list);
      setUnread(sum.unread);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return; // auth ctx handles redirect
    }
  }, []);

  useEffect(() => {
    void refresh();
    const iv = setInterval(refresh, POLL_MS);
    return () => clearInterval(iv);
  }, [refresh]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function onItemClick(n: NotificationDto) {
    setOpen(false);
    if (n.status === 'UNREAD') {
      await notificationsApi.markRead(n.id).catch(() => undefined);
      await refresh();
    }
    if (n.link) router.push(n.link);
  }

  async function markAll() {
    setLoading(true);
    try {
      await notificationsApi.markAllRead();
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white min-w-[18px] h-[18px]">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">
                {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout à jour'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={markAll}
                  className="text-xs font-medium text-secondary hover:underline disabled:opacity-50"
                >
                  <CheckCheck className="inline h-3 w-3 mr-1" />
                  Tout marquer lu
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                Aucune notification.
              </p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onItemClick(n)}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition flex items-start gap-3',
                        n.status === 'UNREAD' && 'bg-primary-50/30',
                      )}
                    >
                      <div
                        className={cn(
                          'mt-1.5 h-2 w-2 rounded-full shrink-0',
                          n.status === 'UNREAD' ? 'bg-secondary' : 'bg-slate-200',
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {n.status === 'UNREAD' && (
                        <Check className="h-3 w-3 text-slate-300 shrink-0 mt-1" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-200 px-4 py-2">
            <Link
              href="/alerts"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-medium text-secondary hover:underline"
            >
              Voir toutes les alertes →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
