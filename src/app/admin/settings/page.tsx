
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore } from "@/firebase/provider";
import { useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, writeBatch, collection } from "firebase/firestore";
import type { AdminWallet, AppSettings } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const settingsSchema = z.object({
    minDeposit: z.coerce.number().positive(),
    maxDeposit: z.coerce.number().positive(),
    minWithdrawal: z.coerce.number().positive(),
    maxWithdrawal: z.coerce.number().positive(),
    maintenanceMode: z.boolean().default(false),
    maintenanceMessage: z.string().optional(),
    investmentsEnabled: z.boolean().default(true),
    depositJazzCashEnabled: z.boolean().default(true),
    depositEasypaisaEnabled: z.boolean().default(true),
    withdrawalJazzCashEnabled: z.boolean().default(true),
    withdrawalEasypaisaEnabled: z.boolean().default(true),
    withdrawalBankEnabled: z.boolean().default(true),
    customerCareWhatsapp: z.string().optional(),
    websiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

const walletSchema = z.object({
    accountHolderName: z.string().min(3, "Required"),
    accountNumber: z.string().min(11, "Required"),
});

type WalletFormData = z.infer&lt;typeof walletSchema&gt;;
type SettingsFormData = z.infer&lt;typeof settingsSchema&gt;;

export default function SettingsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const adminWalletsQuery = useMemoFirebase(() =&gt; firestore ? collection(firestore, 'admin_wallet_details') : null, [firestore]);
    const { data: adminWallets, isLoading: areWalletsLoading } = useCollection&lt;AdminWallet&gt;(adminWalletsQuery);

    const appSettingsDocRef = useMemoFirebase(() =&gt; firestore ? doc(firestore, 'app_settings', 'global') : null, [firestore]);
    const { data: appSettings, isLoading: areSettingsLoading } = useDoc&lt;AppSettings&gt;(appSettingsDocRef);
    
    const jazzcashForm = useForm&lt;WalletFormData&gt;({ 
        resolver: zodResolver(walletSchema),
        defaultValues: { accountHolderName: '', accountNumber: '' }
    });
    const easypaisaForm = useForm&lt;WalletFormData&gt;({ 
        resolver: zodResolver(walletSchema),
        defaultValues: { accountHolderName: '', accountNumber: '' }
    });
    const settingsForm = useForm&lt;SettingsFormData&gt;({ 
        resolver: zodResolver(settingsSchema),
        defaultValues: { 
            minDeposit: 0, 
            maxDeposit: 0, 
            minWithdrawal: 0, 
            maxWithdrawal: 0,
            maintenanceMode: false,
            maintenanceMessage: "The application is currently under maintenance. We are working to improve your experience. Your funds are safe. Please check back later.",
            investmentsEnabled: true,
            depositJazzCashEnabled: true,
            depositEasypaisaEnabled: true,
            withdrawalJazzCashEnabled: true,
            withdrawalEasypaisaEnabled: true,
            withdrawalBankEnabled: true,
            customerCareWhatsapp: '',
            websiteUrl: '',
        }
    });

    useEffect(() =&gt; {
        if(adminWallets) {
            const jazzcash = adminWallets.find(w =&gt; w.walletName === 'JazzCash');
            if(jazzcash) jazzcashForm.reset(jazzcash);

            const easypaisa = adminWallets.find(w =&gt; w.walletName === 'Easypaisa');
            if(easypaisa) easypaisaForm.reset(easypaisa);
        }
        if(appSettings) {
            settingsForm.reset(appSettings);
        }
    }, [adminWallets, appSettings, jazzcashForm, easypaisaForm, settingsForm]);

    const handleWalletsSubmit = async () =&gt; {
        if (!firestore) return;
        const batch = writeBatch(firestore);

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

    const handleSettingsSubmit = async (data: SettingsFormData) =&gt; {
        if (!firestore || !appSettingsDocRef) return;
        try {
            const batch = writeBatch(firestore);
            batch.set(appSettingsDocRef, data, { merge: true });
            await batch.commit();
            toast({ title: "Success", description: "Settings updated successfully." });
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Error", description: "Failed to update settings." });
        }
    };
    
    const isLoading = areWalletsLoading || areSettingsLoading;

    if (isLoading) {
       return &lt;div className="flex justify-center items-center h-full"&gt;
            &lt;div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"&gt;&lt;/div&gt;
        &lt;/div&gt;;
    }

    return (
        &lt;div className="space-y-8"&gt;
            &lt;header&gt;
                &lt;h1 className="text-3xl font-bold tracking-tight font-headline"&gt;Application Settings&lt;/h1&gt;
                &lt;p className="text-muted-foreground"&gt;Manage admin wallets, transaction limits, and feature toggles.&lt;/p&gt;
            &lt;/header&gt;

            &lt;Form {...settingsForm}&gt;
                &lt;form onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)} className="space-y-8"&gt;
                    &lt;Card&gt;
                        &lt;CardHeader&gt;
                            &lt;CardTitle&gt;Feature Controls&lt;/CardTitle&gt;
                            &lt;CardDescription&gt;
                                Enable or disable core application features globally.
                            &lt;/CardDescription&gt;
                        &lt;/CardHeader&gt;
                        &lt;CardContent className="space-y-4"&gt;
                            &lt;FormField control={settingsForm.control} name="investmentsEnabled" render={({ field }) =&gt; (
                                &lt;FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"&gt;
                                    &lt;div className="space-y-0.5"&gt;
                                        &lt;FormLabel className="text-base"&gt;Enable Investments&lt;/FormLabel&gt;
                                        &lt;FormDescription&gt;Allow users to purchase new investment plans.&lt;/FormDescription&gt;
                                    &lt;/div&gt;
                                    &lt;FormControl&gt;&lt;Switch checked={field.value} onCheckedChange={field.onChange} /&gt;&lt;/FormControl&gt;
                                &lt;/FormItem&gt;
                            )} /&gt;
                            &lt;div className="grid grid-cols-1 md:grid-cols-2 gap-4"&gt;
                                &lt;div className="rounded-lg border p-4 space-y-4"&gt;
                                     &lt;h3 className="font-semibold"&gt;Deposit Methods&lt;/h3&gt;
                                     &lt;FormField control={settingsForm.control} name="depositJazzCashEnabled" render={({ field }) =&gt; (
                                        &lt;FormItem className="flex flex-row items-center justify-between"&gt;
                                            &lt;FormLabel&gt;JazzCash&lt;/FormLabel&gt;
                                            &lt;FormControl&gt;&lt;Switch checked={field.value} onCheckedChange={field.onChange} /&gt;&lt;/FormControl&gt;
                                        &lt;/FormItem&gt;
                                     )}/&gt;
                                      &lt;FormField control={settingsForm.control} name="depositEasypaisaEnabled" render={({ field }) =&gt; (
                                        &lt;FormItem className="flex flex-row items-center justify-between"&gt;
                                            &lt;FormLabel&gt;Easypaisa&lt;/FormLabel&gt;
                                            &lt;FormControl&gt;&lt;Switch checked={field.value} onCheckedChange={field.onChange} /&gt;&lt;/FormControl&gt;
                                        &lt;/FormItem&gt;
                                     )}/&gt;
                                &lt;/div&gt;
                                &lt;div className="rounded-lg border p-4 space-y-4"&gt;
                                     &lt;h3 className="font-semibold"&gt;Withdrawal Methods&lt;/h3&gt;
                                      &lt;FormField control={settingsForm.control} name="withdrawalJazzCashEnabled" render={({ field }) =&gt; (
                                        &lt;FormItem className="flex flex-row items-center justify-between"&gt;
                                            &lt;FormLabel&gt;JazzCash&lt;/FormLabel&gt;
                                            &lt;FormControl&gt;&lt;Switch checked={field.value} onCheckedChange={field.onChange} /&gt;&lt;/FormControl&gt;
                                        &lt;/FormItem&gt;
                                     )}/&gt;
                                      &lt;FormField control={settingsForm.control} name="withdrawalEasypaisaEnabled" render={({ field }) =&gt; (
                                        &lt;FormItem className="flex flex-row items-center justify-between"&gt;
                                            &lt;FormLabel&gt;Easypaisa&lt;/FormLabel&gt;
                                            &lt;FormControl&gt;&lt;Switch checked={field.value} onCheckedChange={field.onChange} /&gt;&lt;/FormControl&gt;
                                        &lt;/FormItem&gt;
                                     )}/&gt;
                                      &lt;FormField control={settingsForm.control} name="withdrawalBankEnabled" render={({ field }) =&gt; (
                                        &lt;FormItem className="flex flex-row items-center justify-between"&gt;
                                            &lt;FormLabel&gt;Bank Transfer&lt;/FormLabel&gt;
                                            &lt;FormControl&gt;&lt;Switch checked={field.value} onCheckedChange={field.onChange} /&gt;&lt;/FormControl&gt;
                                        &lt;/FormItem&gt;
                                     )}/&gt;
                                &lt;/div&gt;
                            &lt;/div&gt;
                        &lt;/CardContent&gt;
                    &lt;/Card&gt;
                    
                    &lt;Card&gt;
                        &lt;CardHeader&gt;
                            &lt;CardTitle&gt;Maintenance Mode&lt;/CardTitle&gt;
                            &lt;CardDescription&gt;
                                Enable maintenance mode to show a temporary page to users.
                            &lt;/CardDescription&gt;
                        &lt;/CardHeader&gt;
                        &lt;CardContent className="space-y-6"&gt;
                            &lt;FormField control={settingsForm.control} name="maintenanceMode" render={({ field }) =&gt; (
                                &lt;FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"&gt;
                                    &lt;div className="space-y-0.5"&gt;
                                        &lt;FormLabel className="text-base"&gt;Enable Maintenance Mode&lt;/FormLabel&gt;
                                        &lt;FormDescription&gt;If enabled, all non-admin users will see the maintenance page.&lt;/FormDescription&gt;
                                    &lt;/div&gt;
                                    &lt;FormControl&gt;&lt;Switch checked={field.value} onCheckedChange={field.onChange} /&gt;&lt;/FormControl&gt;
                                &lt;/FormItem&gt;
                            )} /&gt;
                            &lt;FormField control={settingsForm.control} name="maintenanceMessage" render={({ field }) =&gt; (
                                &lt;FormItem&gt;
                                    &lt;FormLabel&gt;Maintenance Message&lt;/FormLabel&gt;
                                    &lt;FormControl&gt;&lt;Textarea placeholder="Tell users what's happening..." className="resize-none" {...field} value={field.value ?? ''} /&gt;&lt;/FormControl&gt;
                                    &lt;FormDescription&gt;This message will be displayed to users on the maintenance page.&lt;/FormDescription&gt;
                                    &lt;FormMessage /&gt;
                                &lt;/FormItem&gt;
                            )} /&gt;
                        &lt;/CardContent&gt;
                    &lt;/Card&gt;

                    &lt;Card&gt;
                        &lt;CardHeader&gt;
                            &lt;CardTitle&gt;Admin Wallet Details&lt;/CardTitle&gt;
                            &lt;CardDescription&gt;Update the accounts where users will send deposits.&lt;/CardDescription&gt;
                        &lt;/CardHeader&gt;
                        &lt;CardContent className="space-y-6"&gt;
                            &lt;div className="grid md:grid-cols-2 gap-6"&gt;
                                &lt;div className="space-y-4 p-4 border rounded-lg"&gt;
                                    &lt;h3 className="font-semibold text-lg"&gt;JazzCash Account&lt;/h3&gt;
                                    &lt;Form {...jazzcashForm}&gt;
                                    &lt;FormField control={jazzcashForm.control} name="accountHolderName" render={({ field }) =&gt; (
                                        &lt;FormItem&gt;
                                            &lt;FormLabel&gt;Account Holder Name&lt;/FormLabel&gt;
                                            &lt;FormControl&gt;&lt;Input {...field} /&gt;&lt;/FormControl&gt;
                                            &lt;FormMessage /&gt;
                                        &lt;/FormItem&gt;
                                    )} /&gt;
                                    &lt;FormField control={jazzcashForm.control} name="accountNumber" render={({ field }) =&gt; (
                                        &lt;FormItem&gt;
                                            &lt;FormLabel&gt;Account Number&lt;/FormLabel&gt;
                                            &lt;FormControl&gt;&lt;Input {...field} /&gt;&lt;/FormControl&gt;
                                            &lt;FormMessage /&gt;
                                        &lt;/FormItem&gt;
                                    )} /&gt;
                                    &lt;/Form&gt;
                                &lt;/div&gt;

                                 &lt;div className="space-y-4 p-4 border rounded-lg"&gt;
                                    &lt;h3 className="font-semibold text-lg"&gt;Easypaisa Account&lt;/h3&gt;
                                    &lt;Form {...easypaisaForm}&gt;
                                    &lt;FormField control={easypaisaForm.control} name="accountHolderName" render={({ field }) =&gt; (
                                        &lt;FormItem&gt;
                                            &lt;FormLabel&gt;Account Holder Name&lt;/FormLabel&gt;
                                            &lt;FormControl&gt;&lt;Input {...field} /&gt;&lt;/FormControl&gt;
                                            &lt;FormMessage /&gt;
                                        &lt;/FormItem&gt;
                                    )} /&gt;
                                    &lt;FormField control={easypaisaForm.control} name="accountNumber" render={({ field }) =&gt; (
                                        &lt;FormItem&gt;
                                            &lt;FormLabel&gt;Account Number&lt;/FormLabel&gt;
                                            &lt;FormControl&gt;&lt;Input {...field} /&gt;&lt;/FormControl&gt;
                                            &lt;FormMessage /&gt;
                                        &lt;/FormItem&gt;
                                    )} /&gt;
                                    &lt;/Form&gt;
                                &lt;/div&gt;
                            &lt;/div&gt;
                             &lt;Button type="button" onClick={handleWalletsSubmit} disabled={jazzcashForm.formState.isSubmitting || easypaisaForm.formState.isSubmitting}&gt;
                                Save Wallet Details
                            &lt;/Button&gt;
                        &lt;/CardContent&gt;
                    &lt;/Card&gt;

                    &lt;Card&gt;
                        &lt;CardHeader&gt;
                            &lt;CardTitle&gt;Transaction Limits&lt;/CardTitle&gt;
                            &lt;CardDescription&gt;Set the minimum and maximum amounts for deposits and withdrawals.&lt;/CardDescription&gt;
                        &lt;/CardHeader&gt;
                        &lt;CardContent&gt;
                           &lt;div className="grid md:grid-cols-2 gap-6"&gt;
                             &lt;FormField control={settingsForm.control} name="minDeposit" render={({ field }) =&gt; (
                                &lt;FormItem&gt;
                                    &lt;FormLabel&gt;Min Deposit (PKR)&lt;/FormLabel&gt;
                                    &lt;FormControl&gt;&lt;Input type="number" {...field} /&gt;&lt;/FormControl&gt;
                                    &lt;FormMessage /&gt;
                                &lt;/FormItem&gt;
                            )} /&gt;
                             &lt;FormField control={settingsForm.control} name="maxDeposit" render={({ field }) =&gt; (
                                &lt;FormItem&gt;
                                    &lt;FormLabel&gt;Max Deposit (PKR)&lt;/FormLabel&gt;
                                    &lt;FormControl&gt;&lt;Input type="number" {...field} /&gt;&lt;/FormControl&gt;
                                    &lt;FormMessage /&gt;
                                &lt;/FormItem&gt;
                            )} /&gt;
                             &lt;FormField control={settingsForm.control} name="minWithdrawal" render={({ field }) =&gt; (
                                &lt;FormItem&gt;
                                    &lt;FormLabel&gt;Min Withdrawal (PKR)&lt;/FormLabel&gt;
                                    &lt;FormControl&gt;&lt;Input type="number" {...field} /&gt;&lt;/FormControl&gt;
                                    &lt;FormMessage /&gt;
                                &lt;/FormItem&gt;
                            )} /&gt;
                             &lt;FormField control={settingsForm.control} name="maxWithdrawal" render={({ field }) =&gt; (
                                &lt;FormItem&gt;
                                    &lt;FormLabel&gt;Max Withdrawal (PKR)&lt;/FormLabel&gt;
                                    &lt;FormControl&gt;&lt;Input type="number" {...field} /&gt;&lt;/FormControl&gt;
                                    &lt;FormMessage /&gt;
                                &lt;/FormItem&gt;
                            )} /&gt;
                           &lt;/div&gt;
                        &lt;/CardContent&gt;
                    &lt;/Card&gt;

                    &lt;Card&gt;
                        &lt;CardHeader&gt;
                            &lt;CardTitle&gt;Referral &amp; Support&lt;/CardTitle&gt;
                            &lt;CardDescription&gt;Set the base website URL for referral links and the WhatsApp number for support.&lt;/CardDescription&gt;
                        &lt;/CardHeader&gt;
                        &lt;CardContent className="space-y-6"&gt;
                            &lt;FormField
                                control={settingsForm.control}
                                name="websiteUrl"
                                render={({ field }) =&gt; (
                                    &lt;FormItem&gt;
                                        &lt;FormLabel&gt;Website URL&lt;/FormLabel&gt;
                                        &lt;FormControl&gt;
                                            &lt;Input
                                                placeholder="https://example.com"
                                                {...field}
                                                value={field.value ?? ''}
                                            /&gt;
                                        &lt;/FormControl&gt;
                                        &lt;FormDescription&gt;
                                            This is the base URL used to generate user invitation links.
                                        &lt;/FormDescription&gt;
                                        &lt;FormMessage /&gt;
                                    &lt;/FormItem&gt;
                                )}
                            /&gt;
                            &lt;FormField
                                control={settingsForm.control}
                                name="customerCareWhatsapp"
                                render={({ field }) =&gt; (
                                    &lt;FormItem&gt;
                                        &lt;FormLabel&gt;WhatsApp Number&lt;/FormLabel&gt;
                                        &lt;FormControl&gt;
                                            &lt;Input
                                                placeholder="e.g., 923001234567"
                                                {...field}
                                                value={field.value ?? ''}
                                            /&gt;
                                        &lt;/FormControl&gt;
                                        &lt;FormDescription&gt;
                                            Include country code without '+' or '00'. Users will be directed to this number for support.
                                        &lt;/FormDescription&gt;
                                        &lt;FormMessage /&gt;
                                    &lt;/FormItem&gt;
                                )}
                            /&gt;
                        &lt;/CardContent&gt;
                    &lt;/Card&gt;

                    &lt;Button type="submit" size="lg" className="w-full md:w-auto" disabled={settingsForm.formState.isSubmitting}&gt;Save All Settings&lt;/Button&gt;
                &lt;/form&gt;
            &lt;/Form&gt;
        &lt;/div&gt;
    );
}

    