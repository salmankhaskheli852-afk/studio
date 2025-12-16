'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser, useCollection, useMemoFirebase } from "@/firebase";
import { useFirestore } from "@/firebase/provider";
import { collection, query, where, Timestamp, orderBy, doc, getDoc, runTransaction } from "firebase/firestore";
import { MoreHorizontal, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Transaction } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type AppUser = {
  id: string;
  displayName: string;
  email: string;
  isAdmin?: boolean;
  photoURL?: string;
  referralCode?: string;
  investments?: any[];
};

type UserWithTransactions = AppUser & { 
    transactions: Transaction[],
    totalEarned: number,
    totalWithdrawn: number
};

export function AdminClient() {
  const { user: adminUser, isUserLoading: isAdminLoading } = useUser();
  const firestore = useFirestore();
  const [selectedUser, setSelectedUser] = useState<UserWithTransactions | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(
    () => (firestore && adminUser ? collection(firestore, 'users') : null),
    [firestore, adminUser]
  );
  const { data: users, isLoading: areUsersLoading } = useCollection<AppUser>(usersQuery);

  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return Timestamp.fromDate(date);
  }, []);

  const userTransactionsQuery = useMemoFirebase(
    () =>
      selectedUser && firestore
        ? query(
            collection(firestore, `users/${selectedUser.id}/wallet/${selectedUser.id}/transactions`),
            where('timestamp', '>=', sevenDaysAgo),
            orderBy('timestamp', 'desc')
          )
        : null,
    [firestore, selectedUser, sevenDaysAgo]
  );

  const { data: transactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(userTransactionsQuery);

  const handleViewDetails = (user: AppUser) => {
    const userWithDetails: UserWithTransactions = {
        ...user,
        transactions: [],
        totalEarned: 0,
        totalWithdrawn: 0
    };
    setSelectedUser(userWithDetails);
    setIsModalOpen(true);
  };

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
        // Note: Manual refresh might be needed or optimistic UI update
    } catch(e) {
        console.error("Failed to update user role:", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to update user role.`
        });
    }
  }
  
  // Calculate totals when transactions data is available
  useMemo(() => {
    if (transactions && selectedUser) {
        let totalEarned = 0;
        let totalWithdrawn = 0;
        transactions.forEach(t => {
            if (t.type === 'Deposit' || t.type === 'Investment') { 
                if(t.amount > 0) totalEarned += t.amount;
            } else if (t.type === 'Withdrawal') {
                totalWithdrawn += Math.abs(t.amount);
            }
        });
        setSelectedUser(prev => prev ? { ...prev, transactions, totalEarned, totalWithdrawn } : null);
    }
  }, [transactions, selectedUser?.id]);


  if (isAdminLoading || areUsersLoading) {
    return <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>;
  }


  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline">User Dashboard</h1>
        <p className="text-muted-foreground">Manage all users and their data.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Total users: {users?.length ?? 0}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>UID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.displayName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{u.id}</TableCell>
                   <TableCell>
                    {u.isAdmin ? <span className="flex items-center gap-2 text-primary font-semibold"><ShieldCheck className="h-4 w-4"/> Admin</span> : "User"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog open={isModalOpen && selectedUser?.id === u.id} onOpenChange={(isOpen) => {
                      setIsModalOpen(isOpen);
                      if (!isOpen) {
                        setSelectedUser(null);
                      }
                    }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onClick={() => handleViewDetails(u)}>
                                View Details
                            </DropdownMenuItem>
                          </DialogTrigger>
                           <DropdownMenuItem onClick={() => handleSetAdmin(u.id, !u.isAdmin)}>
                                {u.isAdmin ? "Remove Admin" : "Make Admin"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {selectedUser && (
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Details for {selectedUser.displayName}</DialogTitle>
                                <DialogDescription>
                                    7-day transaction history, earnings, and withdrawals.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <p><span className="font-semibold">Total Earned (7d):</span> PKR {selectedUser.totalEarned.toLocaleString()}</p>
                                <p><span className="font-semibold">Total Withdrawn (7d):</span> PKR {selectedUser.totalWithdrawn.toLocaleString()}</p>
                            </div>
                            <h3 className="font-semibold mt-4 mb-2">Transaction History (Last 7 Days)</h3>
                            {areTransactionsLoading ? <p>Loading history...</p> : (
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                     <TableHead>Status</TableHead>
                                    <TableHead>Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedUser.transactions.length > 0 ? selectedUser.transactions.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell>{t.timestamp && (t.timestamp as any).seconds ? new Date((t.timestamp as any).seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell>{t.type}</TableCell>
                                            <TableCell>{t.status}</TableCell>
                                            <TableCell className={`${t.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{t.amount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={4} className="text-center">No transactions in the last 7 days.</TableCell></TableRow>}
                                </TableBody>
                                </Table>
                            )}
                        </DialogContent>
                      )}
                    </Dialog>
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
