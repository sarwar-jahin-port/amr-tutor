'use client';

import { BookOpen, GraduationCap, Home, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/tutors', label: 'Tutors', icon: GraduationCap },
  { href: '/tuition', label: 'Tuition', icon: BookOpen },
];

export function BottomNav() {
  const pathname = usePathname();
  const { status, user } = useAuth();
  
  const profileHref = status === 'authenticated' && user ? '/dashboard' : '/login';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-center justify-around border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-surface/80 md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              isActive ? 'text-primary' : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
      
      <Link
        href={profileHref}
        className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
          pathname.startsWith('/dashboard') || pathname.startsWith('/login')
            ? 'text-primary'
            : 'text-ink-secondary hover:text-ink'
        }`}
      >
        <User className="size-5" />
        <span className="text-[10px] font-medium">{user ? 'Profile' : 'Log in'}</span>
      </Link>
    </nav>
  );
}
