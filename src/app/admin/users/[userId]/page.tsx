'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { doc, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/data';
import { ShieldCheck, Crown } from 'lucide-react';

type AppUser = {
  id: string;
  displayName: string;
  email: string;
  role?: 'user' | 'localAdmin' | 'proAdmin';
  photoURL?: string;
  referralCode?: string;
  investments?: any[];
};

type Wallet = {
    balance: number;
}

const RoleIcon = ({ role }: { role?: AppUser['role'] }) => {
    if (role === 'proAdmin') {
        return <Crown className="h-6 w-6 text-amber-500" />;
    }
    if (role === 'localAdmin') {
        return <ShieldCheck className="h-6 w-6 text-primary" />;
    }
    return null;
}

export default function UserDetailsPage() {
    const params = useParams();
    const userId = params.userId as string;
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(
        () => (firestore && userId ? doc(firestore, 'users', userId) : null),
        [firestore, userId]
    );
    const { data: userData, isLoading: isUserLoading } = useDoc<AppUser>(userDocRef);

    const walletDocRef = useMemoFirebase(
        () => (firestore && userId ? doc(firestore, `users/${userId}/wallet`, userId) : null),
        [firestore, userId]
    );
    const { data: walletData, isLoading: isWalletLoading } = useDoc<Wallet>(walletDocRef);

    const transactionsQuery = useMemoFirebase(
        () => (firestore && userId) ? query(collection(firestore, `users/${userId}/wallet/${userId}/transactions`), orderBy('timestamp', 'desc')) : null,
        [firestore, userId]
    );
    const { data: transactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

    const stats = useMemo(() => {
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let totalInvestments = 0;
        
        transactions?.forEach(t => {
            if(t.status === 'Completed') {
                if(t.type === 'Deposit') totalDeposits += t.amount;
                if(t.type === 'Withdrawal') totalWithdrawals += Math.abs(t.amount);
                if(t.type === 'Investment') totalInvestments += Math.abs(t.amount);
            }
        });
        return { totalDeposits, totalWithdrawals, totalInvestments };
    }, [transactions]);
    
    const isLoading = isUserLoading || isWalletLoading || areTransactionsLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!userData) {
        return <div className="text-center">User not found.</div>;
    }

    const getStatusBadgeVariant = (status?: Transaction["status"]) => {
        switch (status) {
          case "Completed":
            return "default";
          case "Pending":
            return "secondary";
          case "Failed":
            return "destructive";
          default:
            return "outline";
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                     <Avatar className="h-20 w-20">
                        <AvatarImage src={userData.photoURL ?? ''} alt={userData.displayName ?? 'User'} />
                        <AvatarFallback>{userData.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            {userData.displayName}
                            <RoleIcon role={userData.role} />
                        </CardTitle>
                        <CardDescription>{userData.email}</CardDescription>
                         <p className="text-sm text-muted-foreground font-mono pt-1">ID: {userData.id}</p>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">PKR {walletData?.balance.toLocaleString() ?? '0'}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">PKR {stats.totalDeposits.toLocaleString()}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">PKR {stats.totalWithdrawals.toLocaleString()}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">PKR {stats.totalInvestments.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Full transaction history for this user.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount (PKR)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions && transactions.length > 0 ? (
                                transactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell>{t.timestamp && (t.timestamp as Timestamp).seconds ? new Date((t.timestamp as Timestamp).seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell>{t.type}</TableCell>
                                        <TableCell><Badge variant={getStatusBadgeVariant(t.status)}>{t.status}</Badge></TableCell>
                                        <TableCell className={`text-right font-medium ${t.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{Math.abs(t.amount).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No transactions found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
