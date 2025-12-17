'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  TrendingUp,
  Users,
  Menu,
  Landmark,
  LogOut,
  User as UserIcon,
  Banknote,
  Shield,
  LayoutDashboard,
  ArrowDownToDot,
  ArrowUpFromDot,
  Wallet,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useAuth } from '@/firebase';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const allNavItems = [
  // User items
  { href: '/', label: 'Home', icon: Home, adminOnly: false },
  { href: '/invest', label: 'Invest', icon: TrendingUp, adminOnly: false },
  { href: '/wallet', label: 'Wallet', icon: Wallet, adminOnly: false },
  { href: '/my-bank', label: 'History', icon: Banknote, adminOnly: false },
  { href: '/invite', label: 'Invite', icon: Users, adminOnly: false },
  // Admin items
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
  { href: '/admin/deposits', label: 'Deposit Requests', icon: ArrowDownToDot, adminOnly: true },
  { href: '/admin/withdrawals', label: 'Withdrawal Requests', icon: ArrowUpFromDot, adminOnly: true },
  { href: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

const ADMIN_EMAIL = "salmankhaskheli885@gmail.com";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  const isAdmin = useMemo(() => user?.email === ADMIN_EMAIL, [user]);

  // Redirect logic
  useEffect(() => {
    if (!isUserLoading && user) {
      if (isAdmin && !pathname.startsWith('/admin')) {
        router.replace('/admin');
      } else if (!isAdmin && pathname.startsWith('/admin')) {
        router.replace('/');
      }
    } else if (!isUserLoading && !user && pathname.startsWith('/admin')) {
        router.replace('/login');
    }
  }, [user, isUserLoading, isAdmin, pathname, router]);

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/login');
    }
  };

  const navItems = useMemo(() => {
    return allNavItems.filter(item => item.adminOnly === isAdmin);
  }, [isAdmin]);

  const NavContent = () => (
    <nav className="flex flex-col gap-4">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold"
        onClick={() => setSheetOpen(false)}
      >
        <Landmark className="h-6 w-6 text-primary" />
        <span className="font-headline">InvestPro</span>
      </Link>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setSheetOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
            pathname === item.href
              ? 'bg-muted text-primary'
              : 'text-muted-foreground'
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
  
  // Don't render the layout on the login page
  if (pathname === '/login') {
    return <>{children}</>;
  }


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r md:block sidebar-bubble-bg">
        <div className="flex h-full max-h-screen flex-col gap-2 p-4">
          <NavContent />
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-4 md:hidden">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">A list of links to navigate the application.</SheetDescription>
              <NavContent />
            </SheetContent>
          </Sheet>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold md:hidden">
              <Landmark className="h-6 w-6 text-primary" />
              <span className="font-headline">InvestPro</span>
            </div>
            <div className="w-full flex-1" />
            {isUserLoading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                  >
                    <Avatar>
                      <AvatarImage
                        src={user.photoURL ?? ''}
                        alt={user.displayName ?? ''}
                      />
                      <AvatarFallback>
                        {user.displayName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!isAdmin && (
                     <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <UserIcon className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}
