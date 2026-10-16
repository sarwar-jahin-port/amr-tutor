'use client';

import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  addUserNote,
  changeUserRole,
  getUserDetail,
  revokeUserSessions,
  updateGuardianProfileAsAdmin,
  updateTutorProfileAsAdmin,
} from '@/features/admin/user-detail-api';
import { updateUserStatus } from '@/features/admin/users-api';
import type { AdminUserDetail, Role } from '@/features/admin/types';
import { useAuth } from '@/features/auth/auth-context';
import { AuthedApiError } from '@/lib/authed-api';

const ALL_ROLES: Role[] = ['TUTOR', 'GUARDIAN', 'VERIFIER', 'MODERATOR', 'ADMIN'];
const ACADEMIC_STATUSES = ['CURRENT_STUDENT', 'GRADUATED', 'OTHER'];

const STATUS_BADGE: Record<string, 'neutral' | 'success' | 'danger'> = {
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  PENDING_DELETION: 'neutral',
  DELETED: 'neutral',
};

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function RolesEditor({ detail, onChanged }: { detail: AdminUserDetail; onChanged: (d: AdminUserDetail) => void }) {
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<Role | null>(null);
  const [busy, setBusy] = useState(false);
  const availableToAdd = ALL_ROLES.filter((r) => !detail.user.roles.includes(r));

  async function remove(role: Role) {
    setBusy(true);
    try {
      onChanged(await changeUserRole(detail.user.id, role, 'REMOVE'));
    } catch (error) {
      toast({ title: "Couldn't remove role", description: errorMessage(error), variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (!pending) return;
    setBusy(true);
    try {
      onChanged(await changeUserRole(detail.user.id, pending, 'ADD'));
      setAdding(false);
      setPending(null);
    } catch (error) {
      toast({ title: "Couldn't add role", description: errorMessage(error), variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {detail.user.roles.map((role) => (
        <Badge key={role} variant="information" className="gap-1">
          {role}
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove(role)}
            className="rounded-full hover:bg-information/10"
            aria-label={`Remove ${role} role`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {adding ? (
        <div className="flex items-center gap-1">
          <Select value={pending ?? undefined} onValueChange={(v) => setPending(v as Role)}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="secondary" disabled={!pending || busy} onClick={() => void add()}>
            Add
          </Button>
          <Button size="sm" variant="tertiary" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        availableToAdd.length > 0 && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-xs text-ink-secondary hover:border-primary hover:text-primary"
          >
            <Plus className="size-3" /> Add role
          </button>
        )
      )}
    </div>
  );
}

function TutorProfileCard({ detail, onChanged }: { detail: AdminUserDetail; onChanged: () => void }) {
  const profile = detail.tutorProfile;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: profile?.fullName ?? '',
    department: profile?.department ?? '',
    degreeProgram: profile?.degreeProgram ?? '',
    academicStatus: profile?.academicStatus ?? 'CURRENT_STUDENT',
    academicYear: profile?.academicYear ?? '',
    introduction: profile?.introduction ?? '',
    preferredFeeMin: profile?.preferredFeeMin?.toString() ?? '',
    preferredFeeMax: profile?.preferredFeeMax?.toString() ?? '',
    isAvailable: detail.tutorIsAvailable ?? true,
  });

  if (!profile) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-2 font-semibold text-ink">Tutor profile</h2>
        <p className="text-sm text-ink-secondary">This account hasn&apos;t created a tutor profile yet.</p>
      </div>
    );
  }

  async function save() {
    setSaving(true);
    try {
      await updateTutorProfileAsAdmin(detail.user.id, {
        fullName: form.fullName,
        department: form.department,
        degreeProgram: form.degreeProgram,
        academicStatus: form.academicStatus,
        academicYear: form.academicYear || undefined,
        introduction: form.introduction || undefined,
        preferredFeeMin: form.preferredFeeMin ? Number(form.preferredFeeMin) : undefined,
        preferredFeeMax: form.preferredFeeMax ? Number(form.preferredFeeMax) : undefined,
        isAvailable: form.isAvailable,
      });
      toast({ title: 'Tutor profile updated' });
      setEditing(false);
      onChanged();
    } catch (error) {
      toast({ title: "Couldn't update profile", description: errorMessage(error), variant: 'danger' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Tutor profile</h2>
        <div className="flex items-center gap-2">
          {profile.isVerified && <Badge variant="success">Verified</Badge>}
          <Badge variant={form.isAvailable ? 'success' : 'neutral'}>{form.isAvailable ? 'Available' : 'Unavailable'}</Badge>
          {!editing && (
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Full name</FieldLabel>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel>Department</FieldLabel>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel>Degree program</FieldLabel>
              <Input value={form.degreeProgram} onChange={(e) => setForm({ ...form, degreeProgram: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel>Academic status</FieldLabel>
              <Select value={form.academicStatus} onValueChange={(v) => setForm({ ...form, academicStatus: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Academic year</FieldLabel>
              <Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel>Available for tutoring</FieldLabel>
              <Select
                value={form.isAvailable ? 'yes' : 'no'}
                onValueChange={(v) => setForm({ ...form, isAvailable: v === 'yes' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Available</SelectItem>
                  <SelectItem value="no">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Min fee (BDT)</FieldLabel>
              <Input
                type="number"
                value={form.preferredFeeMin}
                onChange={(e) => setForm({ ...form, preferredFeeMin: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Max fee (BDT)</FieldLabel>
              <Input
                type="number"
                value={form.preferredFeeMax}
                onChange={(e) => setForm({ ...form, preferredFeeMax: e.target.value })}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel>Introduction</FieldLabel>
            <Textarea
              value={form.introduction}
              onChange={(e) => setForm({ ...form, introduction: e.target.value })}
              maxLength={1000}
            />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" isLoading={saving} onClick={() => void save()}>
              Save
            </Button>
            <Button size="sm" variant="tertiary" disabled={saving} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-secondary">University</dt>
            <dd className="text-ink">{profile.university.name}</dd>
          </div>
          <div>
            <dt className="text-ink-secondary">Department</dt>
            <dd className="text-ink">{profile.department}</dd>
          </div>
          <div>
            <dt className="text-ink-secondary">Degree</dt>
            <dd className="text-ink">
              {profile.degreeProgram} {profile.academicYear ? `· ${profile.academicYear}` : ''}
            </dd>
          </div>
          <div>
            <dt className="text-ink-secondary">Academic status</dt>
            <dd className="text-ink">{profile.academicStatus}</dd>
          </div>
          <div>
            <dt className="text-ink-secondary">Fee range</dt>
            <dd className="text-ink">
              {profile.preferredFeeMin ?? '—'}–{profile.preferredFeeMax ?? '—'} {profile.feeCurrency}
            </dd>
          </div>
          <div>
            <dt className="text-ink-secondary">Subjects</dt>
            <dd className="text-ink">{profile.subjects.map((s) => s.name).join(', ') || '—'}</dd>
          </div>
          <div>
            <dt className="text-ink-secondary">Curricula</dt>
            <dd className="text-ink">{profile.curricula.map((c) => c.name).join(', ') || '—'}</dd>
          </div>
          <div>
            <dt className="text-ink-secondary">Grades</dt>
            <dd className="text-ink">{profile.grades.join(', ') || '—'}</dd>
          </div>
          {profile.introduction && (
            <div className="sm:col-span-2">
              <dt className="text-ink-secondary">Introduction</dt>
              <dd className="text-ink">{profile.introduction}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

function GuardianProfileCard({ detail, onChanged }: { detail: AdminUserDetail; onChanged: () => void }) {
  const profile = detail.guardianProfile;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ displayName: profile?.displayName ?? '', language: profile?.language ?? 'bn' });

  if (!profile) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-2 font-semibold text-ink">Guardian profile</h2>
        <p className="text-sm text-ink-secondary">This account hasn&apos;t created a guardian profile yet.</p>
      </div>
    );
  }

  async function save() {
    setSaving(true);
    try {
      await updateGuardianProfileAsAdmin(detail.user.id, { displayName: form.displayName, language: form.language });
      toast({ title: 'Guardian profile updated' });
      setEditing(false);
      onChanged();
    } catch (error) {
      toast({ title: "Couldn't update profile", description: errorMessage(error), variant: 'danger' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Guardian profile</h2>
        {!editing && (
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel>Display name</FieldLabel>
            <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel>Language</FieldLabel>
            <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bn">Bangla</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex gap-2">
            <Button size="sm" isLoading={saving} onClick={() => void save()}>
              Save
            </Button>
            <Button size="sm" variant="tertiary" disabled={saving} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-secondary">Display name</dt>
            <dd className="text-ink">{profile.displayName}</dd>
          </div>
          <div>
            <dt className="text-ink-secondary">Language</dt>
            <dd className="text-ink">{profile.language === 'en' ? 'English' : 'Bangla'}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

function ActivitySection({ detail }: { detail: AdminUserDetail }) {
  const { listings, applications, verificationRequests, guardianVerificationRequests, reportsFiled, reportsAgainst } = detail.activity;
  const sections = [
    { title: 'Listings posted', rows: listings.map((l) => ({ id: l.id, label: l.title, status: l.status, date: l.createdAt })) },
    {
      title: 'Applications submitted',
      rows: applications.map((a) => ({ id: a.id, label: a.listingTitle, status: a.status, date: a.submittedAt })),
    },
    {
      title: 'Verification requests',
      rows: verificationRequests.map((v) => ({ id: v.id, label: v.type, status: v.status, date: v.submittedAt })),
    },
    {
      title: 'Identity verification requests',
      rows: guardianVerificationRequests.map((v) => ({ id: v.id, label: v.type, status: v.status, date: v.submittedAt })),
    },
    {
      title: 'Reports filed by this account',
      rows: reportsFiled.map((r) => ({ id: r.id, label: r.category, status: r.status, date: r.createdAt })),
    },
    {
      title: 'Reports filed against this account',
      rows: reportsAgainst.map((r) => ({ id: r.id, label: r.category, status: r.status, date: r.createdAt })),
    },
  ].filter((s) => s.rows.length > 0);

  if (sections.length === 0) {
    return <p className="text-sm text-ink-secondary">No activity recorded for this account yet.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-ink-secondary">{section.title}</h3>
          <div className="flex flex-col gap-1.5">
            {section.rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <span className="text-ink">{row.label}</span>
                <span className="flex items-center gap-2 text-xs text-ink-secondary">
                  {formatDate(row.date)}
                  <Badge variant="neutral">{row.status}</Badge>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesSection({ detail, onChanged }: { detail: AdminUserDetail; onChanged: () => void }) {
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await addUserNote(detail.user.id, body.trim());
      setBody('');
      onChanged();
    } catch (error) {
      toast({ title: "Couldn't add note", description: errorMessage(error), variant: 'danger' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="Internal note (not visible to the account owner)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
        />
        <Button size="sm" className="self-start" isLoading={saving} disabled={!body.trim()} onClick={() => void submit()}>
          Add note
        </Button>
      </div>
      {detail.notes.length === 0 ? (
        <p className="text-sm text-ink-secondary">No notes yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {detail.notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
              <p className="text-ink">{note.body}</p>
              <p className="mt-1 text-xs text-ink-secondary">
                {note.author.email ?? 'Unknown'} · {formatDate(note.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { status, user, startImpersonation } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const isAdmin = Boolean(user?.roles.includes('ADMIN'));

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  function reload() {
    getUserDetail(params.id)
      .then((data) => {
        setDetail(data);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)));
  }

  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAdmin, params.id]);

  if (status === 'loading' || (status === 'authenticated' && isAdmin && !detail && !error)) {
    return (
      <div className="flex flex-col gap-4 max-w-4xl mx-auto py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
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
      <div className="flex flex-col gap-4 max-w-4xl mx-auto py-8">
        <p className="text-ink-secondary">Your account doesn&apos;t have admin access.</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col gap-4 max-w-4xl mx-auto py-8">
        <Link href="/admin/users" className="flex items-center gap-1 text-sm text-ink-secondary hover:text-ink">
          <ArrowLeft className="size-4" /> Back to users
        </Link>
        <p className="text-danger">{error ?? 'User not found.'}</p>
      </div>
    );
  }

  async function handleSuspend() {
    const reason = window.prompt('Reason for suspension (required):');
    if (!reason?.trim()) return;
    setActionBusy(true);
    try {
      await updateUserStatus(detail!.user.id, 'SUSPENDED', reason.trim());
      toast({ title: 'Account suspended' });
      reload();
    } catch (err) {
      toast({ title: "Couldn't suspend account", description: errorMessage(err), variant: 'danger' });
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReactivate() {
    setActionBusy(true);
    try {
      await updateUserStatus(detail!.user.id, 'ACTIVE');
      toast({ title: 'Account reactivated' });
      reload();
    } catch (err) {
      toast({ title: "Couldn't reactivate account", description: errorMessage(err), variant: 'danger' });
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRevokeSessions() {
    if (!window.confirm('Sign this account out of every device? They will need to log in again.')) return;
    setActionBusy(true);
    try {
      await revokeUserSessions(detail!.user.id);
      toast({ title: 'Sessions revoked' });
    } catch (err) {
      toast({ title: "Couldn't revoke sessions", description: errorMessage(err), variant: 'danger' });
    } finally {
      setActionBusy(false);
    }
  }

  async function handleViewAs() {
    if (!window.confirm(`View the app as ${detail!.user.email ?? detail!.user.id}? This is logged, and ends automatically in 15 minutes.`)) {
      return;
    }
    setActionBusy(true);
    try {
      await startImpersonation(detail!.user.id);
      router.push('/dashboard');
    } catch (err) {
      toast({ title: "Couldn't start the support session", description: errorMessage(err), variant: 'danger' });
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-8">
      <Link href="/admin/users" className="flex items-center gap-1 text-sm text-ink-secondary hover:text-ink">
        <ArrowLeft className="size-4" /> Back to users
      </Link>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-lg font-semibold text-ink">{detail.user.email ?? detail.user.phone ?? detail.user.id}</p>
            <p className="text-xs text-ink-secondary">Joined {formatDate(detail.user.createdAt)}</p>
          </div>
          <Badge variant={STATUS_BADGE[detail.user.status] ?? 'neutral'}>{detail.user.status}</Badge>
        </div>

        <RolesEditor detail={detail} onChanged={setDetail} />

        <div className="flex flex-wrap gap-2 pt-1">
          {detail.user.status === 'ACTIVE' ? (
            <Button variant="destructive" size="sm" disabled={actionBusy} onClick={() => void handleSuspend()}>
              Suspend account
            </Button>
          ) : (
            <Button variant="secondary" size="sm" disabled={actionBusy} onClick={() => void handleReactivate()}>
              Reactivate account
            </Button>
          )}
          <Button variant="secondary" size="sm" disabled={actionBusy} onClick={() => void handleRevokeSessions()}>
            Sign out of all devices
          </Button>
          {detail.user.id !== user.id &&
            detail.user.status === 'ACTIVE' &&
            !detail.user.roles.some((r) => r === 'ADMIN' || r === 'MODERATOR' || r === 'VERIFIER') && (
              <Button variant="secondary" size="sm" disabled={actionBusy} onClick={() => void handleViewAs()}>
                View as this user
              </Button>
            )}
        </div>
      </div>

      {detail.user.roles.includes('TUTOR') && <TutorProfileCard detail={detail} onChanged={reload} />}
      {detail.user.roles.includes('GUARDIAN') && <GuardianProfileCard detail={detail} onChanged={reload} />}

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-semibold text-ink">Activity</h2>
        <ActivitySection detail={detail} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-semibold text-ink">Internal notes</h2>
        <NotesSection detail={detail} onChanged={reload} />
      </section>
    </div>
  );
}
