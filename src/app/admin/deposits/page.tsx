
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase/provider";
import { collectionGroup, query, where, getDocs, doc, writeBatch, increment, getDoc } from "firebase/firestore";
import type { Transaction } from "@/lib/data";
import { useToast } from '@/hooks/use-toast';

type TransactionWithUserDetails = Transaction & {
    userId: string;
    userDisplayName: string;
    userEmail: string;
    transactionPath: string;
    accountHolderName?: string;
    accountNumber?: string;
    transactionId?: string;
};

export default function DepositRequestsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [requests, setRequests] = useState<TransactionWithUserDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        if (!firestore) return;
        setIsLoading(true);
        try {
            const transactionsQuery = query(
                collectionGroup(firestore, 'transactions'), 
                where('type', '==', 'Deposit'),
                where('status', '==', 'Pending')
            );
            const querySnapshot = await getDocs(transactionsQuery);

            const fetchedRequests: TransactionWithUserDetails[] = [];

            for (const transactionDoc of querySnapshot.docs) {
                const data = transactionDoc.data() as Transaction;
                const pathParts = transactionDoc.ref.path.split('/');
                const userId = pathParts[1];

                const userDocRef = doc(firestore, 'users', userId);
                const userDoc = await getDoc(userDocRef);


                let userDisplayName = 'Unknown User';
                let userEmail = 'N/A';
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    userDisplayName = userData.displayName;
                    userEmail = userData.email;
                }

                fetchedRequests.push({
                    ...data,
                    id: transactionDoc.id,
                    userId,
                    userDisplayName,
                    userEmail,
                    transactionPath: transactionDoc.ref.path,
                    accountHolderName: data.accountHolderName,
                    accountNumber: data.accountNumber,
                    transactionId: data.transactionId
                });
            }
            setRequests(fetchedRequests);
        } catch (error) {
            console.error("Error fetching deposit requests:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch deposit requests.'
            });
        }
        setIsLoading(false);
    }, [firestore, toast]);
    
    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleRequest = async (request: TransactionWithUserDetails, newStatus: 'Completed' | 'Failed') => {
        if (!firestore) return;

        const batch = writeBatch(firestore);

        const transactionDocRef = doc(firestore, request.transactionPath);
        batch.update(transactionDocRef, { status: newStatus });

        if (newStatus === 'Completed') {
            const walletDocRef = doc(firestore, `users/${request.userId}/wallet`, request.userId);
            batch.update(walletDocRef, { balance: increment(request.amount) });
        }

        try {
            await batch.commit();
            toast({
                title: 'Success',
                description: `Request has been ${newStatus.toLowerCase()}.`
            });
            fetchRequests(); // Refresh the list
        } catch (error) {
            console.error(`Error ${newStatus === 'Completed' ? 'approving' : 'rejecting'} request:`, error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update the request status.'
            });
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
                <h1 className="text-3xl font-bold tracking-tight font-headline">Deposit Requests</h1>
                <p className="text-muted-foreground">Approve or reject pending deposit requests from users.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Deposits</CardTitle>
                    <CardDescription>Total pending requests: {requests.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Amount (PKR)</TableHead>
                                <TableHead>Sender Name</TableHead>
                                <TableHead>Sender Account</TableHead>
                                <TableHead>TID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length > 0 ? requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.userDisplayName}</div>
                                        <div className="text-sm text-muted-foreground">{req.userEmail}</div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-emerald-600">{req.amount.toLocaleString()}</TableCell>
                                    <TableCell>{req.accountHolderName}</TableCell>
                                    <TableCell>{req.accountNumber}</TableCell>
                                    <TableCell className="font-mono">{req.transactionId}</TableCell>
                                     <TableCell>{req.timestamp && (req.timestamp as any).seconds ? new Date((req.timestamp as any).seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => handleRequest(req, 'Completed')}>Approve</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleRequest(req, 'Failed')}>Reject</Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">No pending deposit requests.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

