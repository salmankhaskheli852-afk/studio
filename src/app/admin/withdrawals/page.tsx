
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useFirestore } from "@/firebase/provider";
import { collectionGroup, query, where, getDocs, doc, writeBatch, increment, getDoc } from "firebase/firestore";
import type { Transaction } from "@/lib/data";
import { useToast } from '@/hooks/use-toast';

type WithdrawalRequest = Transaction & {
    userId: string;
    userDisplayName: string;
    userEmail: string;
    transactionPath: string;
    withdrawalMethod?: string;
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
};

export default function WithdrawalRequestsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRequests = useCallback(async () => {
        if (!firestore) return;
        setIsLoading(true);
        try {
            // Query all transactions to avoid needing an index
            const transactionsQuery = query(collectionGroup(firestore, 'transactions'));
            const querySnapshot = await getDocs(transactionsQuery);
            const fetchedRequests: WithdrawalRequest[] = [];

            for (const transactionDoc of querySnapshot.docs) {
                const data = transactionDoc.data() as any;

                // Filter for pending WITHDRAWAL requests on the client
                if (data.type !== 'Withdrawal' || data.status !== 'Pending') {
                    continue;
                }

                const userId = transactionDoc.ref.path.split('/')[1];

                const userDocRef = doc(firestore, 'users', userId);
                const userDocSnap = await getDoc(userDocRef);

                let userDisplayName = 'Unknown User';
                let userEmail = 'N/A';
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    userDisplayName = userData.displayName || 'Unknown User';
                    userEmail = userData.email || 'N/A';
                }

                fetchedRequests.push({
                    ...(data as Transaction),
                    id: transactionDoc.id,
                    userId,
                    userDisplayName,
                    userEmail,
                    transactionPath: transactionDoc.ref.path,
                    withdrawalMethod: data.method,
                    bankName: data.bankName,
                    accountHolder: data.accountHolderName, // Consistent naming
                    accountNumber: data.accountNumber,
                });
            }
            setRequests(fetchedRequests);
        } catch (error) {
            console.error("Error fetching withdrawal requests:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch withdrawal requests.' });
        }
        setIsLoading(false);
    }, [firestore, toast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);
    
    const filteredRequests = useMemo(() => {
        return requests.filter(req =>
            req.userDisplayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (req.accountHolder && req.accountHolder.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (req.accountNumber && req.accountNumber.includes(searchTerm))
        );
    }, [requests, searchTerm]);

    const handleRequest = async (request: WithdrawalRequest, newStatus: 'Completed' | 'Failed') => {
        if (!firestore) return;

        const batch = writeBatch(firestore);
        const transactionDocRef = doc(firestore, request.transactionPath);
        batch.update(transactionDocRef, { status: newStatus });

        // If a request is rejected, refund the user's balance
        if (newStatus === 'Failed') {
            const walletDocRef = doc(firestore, `users/${request.userId}/wallet`, request.userId);
            // amount is negative for withdrawal, so incrementing refunds it
            batch.update(walletDocRef, { balance: increment(Math.abs(request.amount)) });
        }

        try {
            await batch.commit();
            toast({ title: 'Success', description: `Request has been ${newStatus.toLowerCase()}.` });
            fetchRequests();
        } catch (error) {
            console.error(`Error updating request:`, error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update the request status.' });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full">
             <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
         </div>;
     }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Withdrawal Requests</h1>
                <p className="text-muted-foreground">Process pending withdrawal requests from users.</p>
            </header>

            <Card>
                 <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Pending Withdrawals</CardTitle>
                            <CardDescription>Total pending requests: {filteredRequests.length}</CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search requests..."
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
                                <TableHead>User</TableHead>
                                <TableHead>Amount (PKR)</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Account Holder</TableHead>
                                <TableHead>Account Number</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.userDisplayName}</div>
                                        <div className="text-sm text-muted-foreground">{req.userEmail}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{req.userId}</div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-red-600">{Math.abs(req.amount).toLocaleString()}</TableCell>
                                    <TableCell className="capitalize">{req.bankName || req.withdrawalMethod}</TableCell>
                                    <TableCell>{req.accountHolder}</TableCell>
                                    <TableCell>{req.accountNumber}</TableCell>
                                    <TableCell>{req.timestamp && (req.timestamp as any).seconds ? new Date((req.timestamp as any).seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => handleRequest(req, 'Completed')}>Approve</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleRequest(req, 'Failed')}>Reject</Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">No matching withdrawal requests found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
