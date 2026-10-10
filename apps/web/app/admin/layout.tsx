'use client';

import { FileWarning, Flag, Gavel, ScrollText, ShieldCheck, Users, Menu, X, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import type { Role } from '@/features/auth/types';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

const SECTIONS: { href: string; label: string; icon: typeof Users; roles: Role[] }[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MODERATOR', 'VERIFIER'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  { href: '/admin/listings', label: 'Listings', icon: FileWarning, roles: ['ADMIN'] },
  { href: '/admin/reports', label: 'Reports', icon: Flag, roles: ['MODERATOR', 'ADMIN'] },
  { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck, roles: ['VERIFIER', 'ADMIN'] },
  { href: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText, roles: ['ADMIN'] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const sections = SECTIONS.filter((section) => section.roles.some((role) => user?.roles.includes(role)));

  return (
    <div className="flex min-h-screen flex-col bg-surface-hover">
      <SiteHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-ink/50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-surface transition-all duration-300 ease-in-out md:static md:z-auto mt-16 md:mt-0',
            isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0',
            isCollapsed ? 'md:w-16' : 'md:w-64'
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
            <span className="font-semibold text-ink">Admin Panel</span>
            <Button variant="tertiary" size="icon" onClick={() => setIsSidebarOpen(false)}>
              <X className="size-5" />
            </Button>
          </div>
          <div className="hidden h-14 items-center border-b border-border px-4 md:flex">
             <Button variant="tertiary" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="mx-auto shrink-0 text-ink-secondary hover:text-ink">
                <Menu className="size-5" />
             </Button>
             {!isCollapsed && <span className="ml-3 font-semibold text-ink">Admin Panel</span>}
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {sections.map((section) => {
              const active = section.href === '/admin' ? pathname === '/admin' : pathname.startsWith(section.href);
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-soft-green text-primary'
                      : 'text-ink-secondary hover:bg-surface-hover hover:text-ink'
                  )}
                  title={isCollapsed ? section.label : undefined}
                >
                  <section.icon className="size-5 shrink-0" aria-hidden="true" />
                  {!isCollapsed && <span>{section.label}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile header for sidebar toggle */}
          <div className="flex h-14 items-center border-b border-border bg-surface px-4 md:hidden">
            <Button variant="tertiary" size="icon" onClick={() => setIsSidebarOpen(true)} className="-ml-2">
              <Menu className="size-5" />
            </Button>
            <span className="ml-2 font-semibold text-ink">Admin Dashboard</span>
          </div>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
