import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, Calendar, Tv, User, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/kitchen', icon: Calendar, label: 'Kitchen' },
    { href: '/projector', icon: Tv, label: 'Projector' },
    { href: '/my-bookings', icon: User, label: 'My Bookings' },
  ];

  if (isAdmin) {
    navItems.push({ href: '/admin', icon: Settings, label: 'Admin' });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SH</span>
            </div>
            <span className="font-semibold text-lg hidden sm:block">Student Housing</span>
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.name} · Room {user.room_number}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Bottom navigation (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'animate-scale-in')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Side navigation (desktop) */}
      <nav className="fixed left-0 top-16 bottom-0 z-40 hidden w-16 border-r border-border bg-background/95 md:flex md:flex-col md:items-center md:gap-2 md:py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      {/* Desktop content offset */}
      <style>{`
        @media (min-width: 768px) {
          main {
            margin-left: 4rem;
          }
        }
      `}</style>
    </div>
  );
}
