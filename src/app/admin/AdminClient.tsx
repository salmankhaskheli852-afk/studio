'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser, useCollection, useMemoFirebase } from "@/firebase";
import { useFirestore } from "@/firebase/provider";
import { collection, query, runTransaction, getDocs, collectionGroup, doc } from "firebase/firestore";
import { MoreHorizontal, ShieldCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Transaction } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { AdminStats } from '@/components/AdminStats';

type AppUser = {
  id: string;
  customId: string;
  displayName: string;
  email: string;
  isAdmin?: boolean;
  photoURL?: string;
  referralCode?: string;
  investments?: any[];
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

  const usersQuery = useMemoFirebase(
    () => (firestore && adminUser ? collection(firestore, 'users') : null),
    [firestore, adminUser]
  );
  const { data: users, isLoading: areUsersLoading } = useCollection<AppUser>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.customId.toLowerCase().includes(searchTerm.toLowerCase())
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
              investments += Math.abs(t.amount); // Assuming investment amount is stored
              earnings += t.amount; // Placeholder for actual earnings logic
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


  const handleSetAdmin = async (userId: string, makeAdmin: boolean) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    try {
        await runTransaction(firestore, async (transaction) => {
            transaction.update(userDocRef, { isAdmin: makeAdmin });
        });
        toast({
            title: "Success",
            description: `User role updated successfully.`
        });
    } catch(e) {
        console.error("Failed to update user role:", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to update user role.`
        });
    }
  }

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
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono">{u.customId}</TableCell>
                  <TableCell className="font-medium">{u.displayName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                   <TableCell>
                    {u.isAdmin ? <span className="flex items-center gap-2 text-primary font-semibold"><ShieldCheck className="h-4 w-4"/> Admin</span> : "User"}
                  </TableCell>
                  <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem asChild>
                               <Link href={`/admin/users/${u.id}`}>View Details</Link>
                            </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleSetAdmin(u.id, !u.isAdmin)}>
                                {u.isAdmin ? "Remove Admin" : "Make Admin"}
                            </DropdownMenuItem>
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

    