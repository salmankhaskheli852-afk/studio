'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser, useCollection, useMemoFirebase } from "@/firebase";
import { useFirestore } from "@/firebase/provider";
import { collection, query, getDocs, collectionGroup } from "firebase/firestore";
import { MoreHorizontal, ShieldCheck, Search, Ban, UserCheck, UserX, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Transaction } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { AdminStats } from '@/components/AdminStats';
import { blockUser, deleteUser, setUserRole } from './actions';

type AppUser = {
  id: string;
  displayName: string;
  email: string;
  role?: 'user' | 'localAdmin' | 'proAdmin';
  photoURL?: string;
  referralCode?: string;
  investments?: any[];
  disabled?: boolean;
};

export function AdminClient() {
  const { user: adminUser, isUserLoading: isAdminLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [globalStats, setGlobalStats] = useState({
      totalInvestments: 0,
      totalDeposits: 0,
      totalEarnings: 0,
      totalWithdrawals: 0,
      pendingDeposits: 0,
      pendingWithdrawals: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const usersQuery = useMemoFirebase(
    () => (firestore && adminUser ? collection(firestore, 'users') : null),
    [firestore, adminUser]
  );
  const { data: users, isLoading: areUsersLoading, forceRefresh } = useCollection<AppUser>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const allTransactionsQuery = useMemoFirebase(
    () => (firestore ? query(collectionGroup(firestore, 'transactions')) : null),
    [firestore]
  );

  useEffect(() => {
    async function fetchGlobalStats() {
      if (!allTransactionsQuery) return;
      setIsStatsLoading(true);
      
      const querySnapshot = await getDocs(allTransactionsQuery);
      
      let investments = 0, deposits = 0, earnings = 0, withdrawals = 0, pDeposits = 0, pWithdrawals = 0;

      querySnapshot.forEach(doc => {
          const t = doc.data() as Transaction;
          if (t.type === 'Investment' && t.status === 'Completed') {
              investments += Math.abs(t.amount); 
              earnings += t.amount; 
          }
          if (t.type === 'Deposit') {
              if(t.status === 'Completed') deposits += t.amount;
              if(t.status === 'Pending') pDeposits += 1;
          }
          if (t.type === 'Withdrawal') {
              if(t.status === 'Completed') withdrawals += Math.abs(t.amount);
              if(t.status === 'Pending') pWithdrawals += 1;
          }
      });
      
      setGlobalStats({
          totalInvestments: investments,
          totalDeposits: deposits,
          totalEarnings: earnings,
          totalWithdrawals: withdrawals,
          pendingDeposits: pDeposits,
          pendingWithdrawals: pWithdrawals,
      });

      setIsStatsLoading(false);
    }
    fetchGlobalStats();
  }, [allTransactionsQuery]);


  const handleAction = async (action: 'block' | 'unblock' | 'delete' | 'setRole', targetUser: AppUser, role?: AppUser['role']) => {
    setIsActionLoading(targetUser.id);
    try {
        let result;
        if (action === 'delete') {
            result = await deleteUser(targetUser.id);
        } else if (action === 'block' || action === 'unblock') {
            const shouldBlock = action === 'block';
            result = await blockUser(targetUser.id, shouldBlock);
        } else if (action === 'setRole' && role) {
            result = await setUserRole(targetUser.id, role);
        } else {
            throw new Error("Invalid action.");
        }

        if (result.success) {
            toast({
                title: "Success",
                description: result.message,
            });
            forceRefresh(); // Refresh user list data
        } else {
            throw new Error(result.message);
        }
    } catch(e: any) {
        console.error(`Failed to ${action} user:`, e);
        toast({
            variant: "destructive",
            title: "Error",
            description: e.message || `Failed to ${action} user.`
        });
    } finally {
        setIsActionLoading(null);
    }
  }

  const getRoleBadge = (role?: AppUser['role']) => {
    switch (role) {
      case 'proAdmin':
        return <span className="flex items-center gap-2 text-amber-600 font-semibold"><Crown className="h-4 w-4"/> Pro Admin</span>;
      case 'localAdmin':
        return <span className="flex items-center gap-2 text-primary font-semibold"><ShieldCheck className="h-4 w-4"/> Local Admin</span>;
      default:
        return "User";
    }
  };


  if (isAdminLoading || areUsersLoading) {
    return <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage all users and view site-wide statistics.</p>
      </header>

      <AdminStats 
        isLoading={isStatsLoading}
        totalInvestments={globalStats.totalInvestments}
        totalDeposits={globalStats.totalDeposits}
        totalEarnings={globalStats.totalEarnings}
        totalWithdrawals={globalStats.totalWithdrawals}
        pendingDeposits={globalStats.pendingDeposits}
        pendingWithdrawals={globalStats.pendingWithdrawals}
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Total users: {users?.length ?? 0}</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, name, email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((u) => (
                <TableRow key={u.id} className={isActionLoading === u.id ? 'opacity-50' : ''}>
                  <TableCell className="font-mono">{u.id}</TableCell>
                  <TableCell className="font-medium">{u.displayName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                   <TableCell>
                    {u.disabled ? <span className="flex items-center gap-2 text-destructive font-semibold"><Ban className="h-4 w-4"/> Blocked</span> : <span className="text-emerald-600">Active</span>}
                  </TableCell>
                   <TableCell>
                     {getRoleBadge(u.role)}
                  </TableCell>
                  <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isActionLoading === u.id || u.email === adminUser?.email}>
                            {isActionLoading === u.id ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem asChild>
                               <Link href={`/admin/users/${u.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    <span>Set Role</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => handleAction('setRole', u, 'proAdmin')}>
                                        <Crown className="mr-2 h-4 w-4" />
                                        <span>Pro Admin</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAction('setRole', u, 'localAdmin')}>
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        <span>Local Admin</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleAction('setRole', u, 'user')}>
                                        <UserX className="mr-2 h-4 w-4" />
                                        <span>Remove Admin (Set to User)</span>
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={() => handleAction(u.disabled ? 'unblock' : 'block', u)}>
                                {u.disabled ? "Unblock User" : "Block User"}
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Delete User</DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the user <span className="font-bold">{u.displayName}</span> and all their associated data (wallet, transactions, etc.). This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleAction('delete', u)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
