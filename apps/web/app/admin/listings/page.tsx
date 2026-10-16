'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, PauseCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/features/auth/auth-context';
import { getListingQueue, updateListingModerationStatus } from '@/features/admin/listings-api';
import type { ListingDetail } from '@/features/listing-owner/types';
import { AuthedApiError } from '@/lib/authed-api';
import { Input } from '@/components/ui/input';

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

export default function AdminListingsPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  
  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Pagination
  const [filterStatus, setFilterStatus] = useState<string>('PENDING_REVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // Debounced or manually submitted search
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Action State
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const isAdmin = Boolean(user?.roles.includes('ADMIN'));

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  const loadListings = useCallback(async () => {
    if (status !== 'authenticated' || !isAdmin) return;
    setIsLoading(true);
    try {
      const res = await getListingQueue({
        status: filterStatus,
        page,
        limit,
        search: searchQuery || undefined
      });
      setListings(res.data);
      setTotal(res.meta.total);
    } catch (e) {
      toast({ title: 'Failed to load listings', variant: 'danger' });
    } finally {
      setIsLoading(false);
    }
  }, [status, isAdmin, filterStatus, page, limit, searchQuery]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  async function handleDecide(id: string, decision: 'PUBLISHED' | 'REJECTED' | 'PAUSED') {
    let reason;
    if (decision === 'REJECTED') {
      reason = window.prompt("Reason for rejection (required):");
      if (!reason || !reason.trim()) {
        toast({ title: 'A reason is required to reject', variant: 'danger' });
        return;
      }
    }
    
    setPendingAction(`${id}-${decision}`);
    try {
      await updateListingModerationStatus(id, decision, reason?.trim());
      toast({ title: 'Decision recorded', variant: 'success' });
      loadListings(); // Refresh the page to reflect correct total and items
    } catch (error) {
      toast({ title: "Couldn't update listing", description: errorMessage(error), variant: 'danger' });
    } finally {
      setPendingAction(null);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-4 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-40" />
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
      <div className="flex flex-col gap-4 max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Listing Review</h1>
        <p className="text-ink-secondary">Your account doesn&apos;t have admin access.</p>
      </div>
    );
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchTerm);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Listings</h1>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING_REVIEW', 'PUBLISHED', 'PAUSED', 'REJECTED'].map((st) => (
              <Button
                key={st}
                variant={filterStatus === st ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => { setFilterStatus(st); setPage(1); }}
              >
                {st === 'ALL' ? 'All' : st.replace('_', ' ')}
              </Button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-secondary" />
              <Input
                placeholder="Search listings..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-hover text-ink-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Title & Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Class / Curriculum</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-secondary">
                    <Loader2 className="mx-auto size-6 animate-spin text-primary" />
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <EmptyState title="No listings found" description="Try adjusting your filters or search term." />
                  </td>
                </tr>
              ) : (
                listings.map((listing) => {
                  const canApprove = listing.status === 'PENDING_REVIEW' || listing.status === 'PAUSED';
                  const canPause = listing.status === 'PUBLISHED';
                  const canReject = listing.status === 'PENDING_REVIEW' || listing.status === 'PUBLISHED' || listing.status === 'PAUSED';

                  return (
                    <tr key={listing.id} className="transition-colors hover:bg-surface-hover/50">
                      <td className="px-4 py-3">
                        <Link href={`/tuition/${listing.id}`} target="_blank" className="font-semibold text-ink hover:text-primary hover:underline line-clamp-1">
                          {listing.title}
                        </Link>
                        <span className="text-xs text-ink-secondary line-clamp-1">{listing.area}, {listing.city}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{listing.status.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-ink">{listing.classLevel}</span>
                          {listing.curriculum && <span className="text-xs text-ink-secondary">{listing.curriculum.name}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {canApprove && (
                            <Button 
                              size="sm" 
                              variant="secondary"
                              className="h-8 gap-1 border-primary/20 bg-soft-green text-primary hover:bg-primary/20"
                              isLoading={pendingAction === `${listing.id}-PUBLISHED`} 
                              disabled={pendingAction !== null} 
                              onClick={() => handleDecide(listing.id, 'PUBLISHED')}
                            >
                              <CheckCircle className="size-3.5" /> Approve
                            </Button>
                          )}
                          {canPause && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 gap-1"
                              isLoading={pendingAction === `${listing.id}-PAUSED`}
                              disabled={pendingAction !== null}
                              onClick={() => handleDecide(listing.id, 'PAUSED')}
                            >
                              <PauseCircle className="size-3.5" /> Pause
                            </Button>
                          )}
                          {canReject && (
                            <Button 
                              variant="tertiary" 
                              size="sm" 
                              className="h-8 gap-1 text-danger hover:bg-danger-surface hover:text-danger"
                              isLoading={pendingAction === `${listing.id}-REJECTED`} 
                              disabled={pendingAction !== null} 
                              onClick={() => handleDecide(listing.id, 'REJECTED')}
                            >
                              <XCircle className="size-3.5" /> Reject
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!isLoading && total > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
            <p className="text-sm text-ink-secondary">
              Showing <span className="font-medium text-ink">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-medium text-ink">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-medium text-ink">{total}</span> results
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="mr-1 size-4" /> Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page * limit >= total}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
