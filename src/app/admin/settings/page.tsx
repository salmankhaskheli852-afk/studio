'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFirestore } from "@/firebase/provider";
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from "firebase/firestore";
import type { AdminWallet, AppSettings } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

// Schemas
const walletSchema = z.object({
    accountHolderName: z.string().min(3, "Required"),
    accountNumber: z.string().min(11, "Required"),
});

const settingsSchema = z.object({
    minDeposit: z.coerce.number().positive(),
    maxDeposit: z.coerce.number().positive(),
    minWithdrawal: z.coerce.number().positive(),
    maxWithdrawal: z.coerce.number().positive(),
});

type WalletFormData = z.infer<typeof walletSchema>;
type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Data hooks
    const adminWalletsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'admin_wallet_details') : null, [firestore]);
    const { data: adminWallets, isLoading: areWalletsLoading } = useCollection<AdminWallet>(adminWalletsQuery);

    const appSettingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'transaction_limits') : null, [firestore]);
    const { data: appSettings, isLoading: areSettingsLoading } = useDoc<AppSettings>(appSettingsDocRef);
    
    // Forms
    const jazzcashForm = useForm<WalletFormData>({ 
        resolver: zodResolver(walletSchema),
        defaultValues: { accountHolderName: '', accountNumber: '' }
    });
    const easypaisaForm = useForm<WalletFormData>({ 
        resolver: zodResolver(walletSchema),
        defaultValues: { accountHolderName: '', accountNumber: '' }
    });
    const settingsForm = useForm<SettingsFormData>({ 
        resolver: zodResolver(settingsSchema),
        defaultValues: { minDeposit: 0, maxDeposit: 0, minWithdrawal: 0, maxWithdrawal: 0 }
    });

    useEffect(() => {
        if(adminWallets) {
            const jazzcash = adminWallets.find(w => w.walletName === 'JazzCash');
            if(jazzcash) jazzcashForm.reset(jazzcash);

            const easypaisa = adminWallets.find(w => w.walletName === 'Easypaisa');
            if(easypaisa) easypaisaForm.reset(easypaisa);
        }
        if(appSettings) {
            settingsForm.reset(appSettings);
        }
    }, [adminWallets, appSettings, jazzcashForm, easypaisaForm, settingsForm]);

    const handleWalletsSubmit = async () => {
        if (!firestore) return;
        const batch = writeBatch(firestore);

        // Manually trigger validation before submitting
        const isJazzcashValid = await jazzcashForm.trigger();
        const isEasypaisaValid = await easypaisaForm.trigger();

        if (!isJazzcashValid || !isEasypaisaValid) {
             toast({ variant: 'destructive', title: "Validation Error", description: "Please fill out all wallet fields correctly." });
             return;
        }

        const jazzcashData = jazzcashForm.getValues();
        const jazzcashDocRef = doc(firestore, 'admin_wallet_details', 'jazzcash');
        batch.set(jazzcashDocRef, { walletName: 'JazzCash', ...jazzcashData }, { merge: true });

        const easypaisaData = easypaisaForm.getValues();
        const easypaisaDocRef = doc(firestore, 'admin_wallet_details', 'easypaisa');
        batch.set(easypaisaDocRef, { walletName: 'Easypaisa', ...easypaisaData }, { merge: true });

        try {
            await batch.commit();
            toast({ title: "Success", description: "Admin wallets updated successfully." });
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Error", description: "Failed to update wallets." });
        }
    };

    const handleSettingsSubmit = async (data: SettingsFormData) => {
        if (!firestore || !appSettingsDocRef) return;
        try {
            const batch = writeBatch(firestore);
            batch.set(appSettingsDocRef, data, { merge: true });
            await batch.commit();
            toast({ title: "Success", description: "Transaction limits updated successfully." });
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Error", description: "Failed to update settings." });
        }
    };
    
    const isLoading = areWalletsLoading || areSettingsLoading;

    if (isLoading) {
       return <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>;
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Application Settings</h1>
                <p className="text-muted-foreground">Manage admin wallets and transaction limits.</p>
            </header>

            {/* Admin Wallets */}
            <Card>
                <CardHeader>
                    <CardTitle>Admin Wallet Details</CardTitle>
                    <CardDescription>Update the accounts where users will send deposits.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* JazzCash Form */}
                        <Form {...jazzcashForm}>
                            <form className="space-y-4 p-4 border rounded-lg">
                                <h3 className="font-semibold text-lg">JazzCash Account</h3>
                                <FormField control={jazzcashForm.control} name="accountHolderName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Holder Name</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={jazzcashForm.control} name="accountNumber" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Number</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </form>
                        </Form>

                        {/* Easypaisa Form */}
                        <Form {...easypaisaForm}>
                             <form className="space-y-4 p-4 border rounded-lg">
                                <h3 className="font-semibold text-lg">Easypaisa Account</h3>
                                <FormField control={easypaisaForm.control} name="accountHolderName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Holder Name</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={easypaisaForm.control} name="accountNumber" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Number</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </form>
                        </Form>
                    </div>
                     <Button onClick={handleWalletsSubmit} disabled={jazzcashForm.formState.isSubmitting || easypaisaForm.formState.isSubmitting}>
                        Save Wallet Details
                    </Button>
                </CardContent>
            </Card>

            {/* Transaction Limits */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction Limits</CardTitle>
                    <CardDescription>Set the minimum and maximum amounts for deposits and withdrawals.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...settingsForm}>
                        <form onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)} className="space-y-6">
                           <div className="grid md:grid-cols-2 gap-6">
                             <FormField control={settingsForm.control} name="minDeposit" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Min Deposit (PKR)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={settingsForm.control} name="maxDeposit" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Max Deposit (PKR)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={settingsForm.control} name="minWithdrawal" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Min Withdrawal (PKR)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={settingsForm.control} name="maxWithdrawal" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Max Withdrawal (PKR)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                           </div>
                            <Button type="submit" disabled={settingsForm.formState.isSubmitting}>Save Limits</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
