
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
  Package,
  RefreshCw,
  LifeBuoy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useAuth, useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
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
import { cn } from '@/lib/utils';
import type { AppSettings } from '@/lib/data';
import { MaintenancePage } from '@/components/MaintenancePage';

type AppUser = {
  role?: 'admin' | 'user';
}

const allNavItems = [
  // User items
  { href: '/', label: 'Home', icon: Home, roles: ['user'] },
  { href: '/invest', label: 'Invest', icon: TrendingUp, roles: ['user'] },
  { href: '/wallet', label: 'Wallet', icon: Wallet, roles: ['user'] },
  { href: '/my-bank', label: 'History', icon: Banknote, roles: ['user'] },
  { href: '/invite', label: 'Invite', icon: Users, roles: ['user'] },
  // Admin items
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/admin/deposits', label: 'Deposit Requests', icon: ArrowDownToDot, roles: ['admin'] },
  { href: '/admin/withdrawals', label: 'Withdrawal Requests', icon: ArrowUpFromDot, roles: ['admin'] },
  { href: '/admin/investments', label: 'Investments', icon: Package, roles: ['admin'] },
  { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  // Common items (but handled separately)
  // { href: '#', label: 'Customer Service', icon: LifeBuoy, roles: ['user', 'admin'] },
];

const ADMIN_EMAIL = "salmankhaskheli885@gmail.com";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const [isClient, setIsClient] = useState(false);

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData } = useDoc<AppUser>(userDocRef);

  const appSettingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global') : null, [firestore]);
  const { data: appSettings, isLoading: areSettingsLoading } = useDoc<AppSettings>(appSettingsDocRef);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdmin = useMemo(() => user?.email === ADMIN_EMAIL || userData?.role === 'admin', [user, userData]);
  const userRole = isAdmin ? 'admin' : 'user';
  
  // Redirect logic
  useEffect(() => {
    if (!isUserLoading) {
      if (user) { // User is logged in
        if (isAdmin && !pathname.startsWith('/admin')) {
          router.replace('/admin');
        } else if (!isAdmin && pathname.startsWith('/admin')) {
          router.replace('/');
        }
      } else if (pathname !== '/login') { // User not logged in and not on login page
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, isAdmin, pathname, router]);

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/login');
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const navItems = useMemo(() => {
    return allNavItems.filter(item => item.roles.includes(userRole));
  }, [userRole]);

  const whatsappLink = appSettings?.customerCareWhatsapp 
    ? `https://wa.me/${appSettings.customerCareWhatsapp.replace(/[^0-9]/g, '')}` 
    : null;

  const NavContent = () => (
    <nav className="flex flex-col gap-4">
      <Link
        href={isAdmin ? "/admin" : "/"}
        className="flex items-center gap-2 text-lg font-semibold"
        onClick={() => setSheetOpen(false)}
      >
        {isAdmin ? <Shield className="h-6 w-6 text-primary" /> : <Landmark className="h-6 w-6 text-primary" />}
        <span className="font-headline">InvestPro {isAdmin && 'Admin'}</span>
      </Link>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setSheetOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
            pathname === item.href
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground'
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setSheetOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <LifeBuoy className="h-4 w-4" />
          Customer Service
        </a>
      )}
    </nav>
  );
  
  // Don't render the layout on the login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Show maintenance page if enabled, but not for Admins
  if (appSettings?.maintenanceMode && !isAdmin) {
    return <MaintenancePage message={appSettings.maintenanceMessage} />
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className={cn(
          "hidden border-r md:block",
           isClient && isAdmin ? "sidebar-bubble-bg bg-card" : "bg-card"
      )}>
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
          <div className="flex w-full items-center justify-end gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              aria-label="Refresh page"
            >
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </Button>
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
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

    