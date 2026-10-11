'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/features/auth/auth-context';
import { searchUsersPaged, updateUserStatus, type PaginationMeta } from '@/features/admin/users-api';
import type { AdminUser, Role } from '@/features/admin/types';
import { AuthedApiError } from '@/lib/authed-api';

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

const ROLE_OPTIONS: Role[] = ['TUTOR', 'GUARDIAN', 'VERIFIER', 'MODERATOR', 'ADMIN'];
const STATUS_OPTIONS: AdminUser['status'][] = ['ACTIVE', 'SUSPENDED', 'PENDING_DELETION', 'DELETED'];
const ALL = 'ALL';

const STATUS_BADGE: Record<string, 'neutral' | 'success' | 'danger'> = {
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  PENDING_DELETION: 'neutral',
  DELETED: 'neutral',
};

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'email:asc', label: 'Email A–Z' },
  { value: 'email:desc', label: 'Email Z–A' },
] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminUsersPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const isAdmin = Boolean(user?.roles.includes('ADMIN'));

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | typeof ALL>(ALL);
  const [userStatus, setUserStatus] = useState<AdminUser['status'] | typeof ALL>(ALL);
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('createdAt:desc');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [rows, setRows] = useState<AdminUser[] | undefined>(undefined);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  // Debounce free-text search so filtering doesn't need a separate button.
  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return;
    const [sortBy, sortOrder] = sort.split(':') as ['createdAt' | 'email', 'asc' | 'desc'];
    let cancelled = false;
    searchUsersPaged({
      search: search || undefined,
      role: role === ALL ? undefined : [role],
      status: userStatus === ALL ? undefined : [userStatus],
      sortBy,
      sortOrder,
      page,
      limit,
    })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setMeta(res.meta);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [status, isAdmin, search, role, userStatus, sort, page]);

  function handleRoleChange(value: string) {
    setPage(1);
    setRole(value as Role | typeof ALL);
  }

  function handleStatusChange(value: string) {
    setPage(1);
    setUserStatus(value as AdminUser['status'] | typeof ALL);
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setRole(ALL);
    setUserStatus(ALL);
    setSort('createdAt:desc');
    setPage(1);
  }

  const hasFilters = search || role !== ALL || userStatus !== ALL || sort !== 'createdAt:desc';

  async function handleSuspend(target: AdminUser) {
    const reason = window.prompt('Reason for suspension (required):');
    if (!reason?.trim()) return;
    setBusyId(target.id);
    try {
      const updated = await updateUserStatus(target.id, 'SUSPENDED', reason.trim());
      setRows((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      toast({ title: "Couldn't suspend account", description: errorMessage(err), variant: 'danger' });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReactivate(target: AdminUser) {
    setBusyId(target.id);
    try {
      const updated = await updateUserStatus(target.id, 'ACTIVE');
      setRows((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      toast({ title: "Couldn't reactivate account", description: errorMessage(err), variant: 'danger' });
    } finally {
      setBusyId(null);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-4 max-w-6xl mx-auto py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-ink-secondary">Redirecting to log in…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-4 max-w-6xl mx-auto py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Users</h1>
        <p className="text-ink-secondary">Your account doesn&apos;t have admin access.</p>
      </div>
    );
  }

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Users</h1>
        {meta && <p className="text-sm text-ink-secondary">{meta.total} total</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3">
        <Input
          placeholder="Search…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-9 min-w-40 flex-1 text-sm"
        />

        <Select value={role} onValueChange={handleRoleChange}>
          <SelectTrigger className="h-9 w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All roles</SelectItem>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={userStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="tertiary" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-secondary">
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows === undefined ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3" colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-ink-secondary" colSpan={5}>
                  No accounts match these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-canvas">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${row.id}`} className="font-medium text-ink hover:text-primary hover:underline">
                      {row.email ?? row.phone ?? row.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.roles.length > 0 ? (
                        row.roles.map((r) => (
                          <Badge key={r} variant="information">
                            {r}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-ink-secondary">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[row.status] ?? 'neutral'}>{row.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {row.status === 'ACTIVE' ? (
                      <Button
                        variant="tertiary"
                        size="sm"
                        disabled={busyId === row.id}
                        onClick={() => void handleSuspend(row)}
                      >
                        Suspend
                      </Button>
                    ) : row.status === 'SUSPENDED' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busyId === row.id}
                        onClick={() => void handleReactivate(row)}
                      >
                        Reactivate
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
