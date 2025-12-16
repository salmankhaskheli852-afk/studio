'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/data";
import { useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { collection, query, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


export default function MyBankPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const transactionsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, `users/${user.uid}/wallet/${user.uid}/transactions`), orderBy('timestamp', 'desc'), limit(15)) : null,
    [firestore, user]
  );
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const walletDocRef = useMemoFirebase(
    () => (user ? doc(firestore, `users/${user.uid}/wallet`, user.uid) : null),
    [firestore, user]
  );
  const { data: walletData, isLoading: isWalletLoading } = useDoc(walletDocRef);

  // Effect to ensure wallet exists for the logged-in user
  useEffect(() => {
    const ensureWalletExists = async () => {
      if (user && firestore && walletDocRef) {
        const walletSnap = await getDoc(walletDocRef);
        if (!walletSnap.exists()) {
          try {
            await setDoc(walletDocRef, {
              id: user.uid,
              userId: user.uid,
              balance: 0,
            });
            console.log("Wallet created for user:", user.uid);
          } catch (error) {
            console.error("Failed to create wallet:", error);
            toast({
                variant: 'destructive',
                title: 'Wallet Creation Failed',
                description: 'Could not create a wallet for your account.'
            });
          }
        }
      }
    };
    ensureWalletExists();
  }, [user, firestore, walletDocRef, toast]);


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
       <header>
          <h1 className="text-3xl font-bold tracking-tight font-headline">My Bank</h1>
          <p className="text-muted-foreground">View your transaction history.</p>
        </header>
     
        <Card>
            <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>A record of your recent activity.</CardDescription>
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
                        {isLoadingTransactions ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Loading history...</TableCell>
                            </TableRow>
                        ) : transactions && transactions.length > 0 ? (
                            transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                <TableCell>{transaction.timestamp && (transaction.timestamp as any).seconds ? new Date((transaction.timestamp as any).seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell>{transaction.type}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(transaction.status)}>{transaction.status}</Badge>
                                </TableCell>
                                <TableCell className={`text-right font-medium ${transaction.type === 'Deposit' || (transaction.type !== 'Withdrawal' && transaction.amount > 0) ? 'text-emerald-600' : 'text-destructive'}`}>{Math.abs(transaction.amount).toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No transactions found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
