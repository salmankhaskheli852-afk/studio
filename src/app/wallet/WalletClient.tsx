'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowDownToDot, ArrowUpFromDot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { collection, addDoc, serverTimestamp, doc, runTransaction, increment } from 'firebase/firestore';
import type { AdminWallet, AppSettings } from '@/lib/data';

export function WalletClient() {
  const [isDepositOpen, setDepositOpen] = useState(false);
  const [isWithdrawOpen, setWithdrawOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const walletDocRef = useMemoFirebase(
    () => (user ? doc(firestore, `users/${user.uid}/wallet`, user.uid) : null),
    [firestore, user]
  );
  const { data: walletData } = useDoc(walletDocRef);

  const adminWalletsQuery = useMemoFirebase(
      () => firestore ? collection(firestore, 'admin_wallet_details') : null,
      [firestore]
  );
  const { data: adminWallets, isLoading: areWalletsLoading } = useCollection<AdminWallet>(adminWalletsQuery);

  const appSettingsDocRef = useMemoFirebase(
      () => firestore ? doc(firestore, 'app_settings', 'global') : null,
      [firestore]
  );
  const { data: appSettings, isLoading: areSettingsLoading } = useDoc<AppSettings>(appSettingsDocRef);

  const depositSchema = z.object({
    depositTo: z.string({ required_error: "You need to select a deposit method." }),
    accountHolderName: z.string().min(3, 'Name must be at least 3 characters.'),
    accountNumber: z.string().min(11, 'Please enter a valid account number.'),
    amount: z.coerce.number().min(appSettings?.minDeposit ?? 1, `Minimum deposit is ${appSettings?.minDeposit ?? 1}.`).max(appSettings?.maxDeposit ?? 5000000, `Maximum deposit is ${appSettings?.maxDeposit ?? 5000000}.`),
    transactionId: z.string().min(5, 'Please enter a valid Transaction ID (TID).'),
  });

  const withdrawSchema = z.object({
    method: z.enum(['JazzCash', 'Easypaisa', 'Bank'], { required_error: 'You need to select a withdrawal method.' }),
    accountHolderName: z.string().min(3, 'Name must be at least 3 characters.'),
    accountNumber: z.string().min(11, 'Please enter a valid account number.'),
    amount: z.coerce.number().min(appSettings?.minWithdrawal ?? 1, `Minimum withdrawal is ${appSettings?.minWithdrawal ?? 1}.`).max(appSettings?.maxWithdrawal ?? 5000000, `Maximum withdrawal is ${appSettings?.maxWithdrawal ?? 5000000}.`),
    bankName: z.string().optional(),
  }).refine(data => !(data.method === 'Bank' && !data.bankName), {
    message: "Bank name is required for bank transfer",
    path: ["bankName"],
  });


  const depositForm = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      accountHolderName: '',
      accountNumber: '',
      transactionId: '',
      amount: appSettings?.minDeposit
    },
  });

  const withdrawForm = useForm<z.infer<typeof withdrawSchema>>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      accountHolderName: '',
      accountNumber: '',
      amount: appSettings?.minWithdrawal
    },
  });
  
  const watchedWithdrawMethod = useWatch({
    control: withdrawForm.control,
    name: 'method',
  });

  useEffect(() => {
    if(appSettings){
        if (!isDepositOpen) depositForm.reset({amount: appSettings.minDeposit, accountHolderName: '', accountNumber: '', transactionId: ''});
        if (!isWithdrawOpen) withdrawForm.reset({amount: appSettings.minWithdrawal, accountHolderName: '', accountNumber: ''});
    }
  }, [appSettings, depositForm, withdrawForm, isDepositOpen, isWithdrawOpen]);


  async function onDepositSubmit(values: z.infer<typeof depositSchema>) {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    try {
        const transactionsColRef = collection(firestore, `users/${user.uid}/wallet/${user.uid}/transactions`);
        await addDoc(transactionsColRef, {
            ...values,
            type: 'Deposit',
            status: 'Pending',
            timestamp: serverTimestamp(),
            walletId: user.uid,
        });
        toast({ title: 'Deposit Request Submitted', description: 'Your request is pending verification.' });
        setDepositOpen(false);
        depositForm.reset();
    } catch(error) {
        console.error("Error submitting deposit:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your request.' });
    }
  }

  async function onWithdrawSubmit(values: z.infer<typeof withdrawSchema>) {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    const currentBalance = walletData?.balance ?? 0;
    if(currentBalance < values.amount) {
        toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'You do not have enough balance to withdraw.' });
        return;
    }

     try {
        await runTransaction(firestore, async (transaction) => {
            const walletRef = doc(firestore, `users/${user.uid}/wallet`, user.uid);
            const transactionsColRef = collection(firestore, `users/${user.uid}/wallet/${user.uid}/transactions`);
            
            transaction.update(walletRef, { balance: increment(-values.amount) });
            
            const newTransactionRef = doc(transactionsColRef);
            transaction.set(newTransactionRef, {
                ...values,
                amount: -values.amount,
                type: 'Withdrawal',
                status: 'Pending',
                timestamp: serverTimestamp(),
                walletId: user.uid,
            });
        });
        
        toast({ title: 'Withdrawal Request Submitted', description: 'Your request is being processed.' });
        setWithdrawOpen(false);
        withdrawForm.reset();
    } catch (error) {
        console.error("Error submitting withdrawal:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your request.' });
    }
  }

  const enabledDepositMethods = adminWallets?.filter(wallet => {
      if (wallet.walletName === 'JazzCash' && appSettings?.depositJazzCashEnabled) return true;
      if (wallet.walletName === 'Easypaisa' && appSettings?.depositEasypaisaEnabled) return true;
      return false;
  });

  const noDepositMethodsEnabled = !enabledDepositMethods || enabledDepositMethods.length === 0;

  const noWithdrawalMethodsEnabled = !appSettings?.withdrawalJazzCashEnabled && !appSettings?.withdrawalEasypaisaEnabled && !appSettings?.withdrawalBankEnabled;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Wallet</h1>
        <p className="text-muted-foreground">Manage your funds.</p>
      </header>

      <div className="flex justify-center pt-8">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Select an option to manage your funds.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Dialog open={isDepositOpen} onOpenChange={setDepositOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="flex-1" disabled={noDepositMethodsEnabled || areSettingsLoading}>
                  <ArrowDownToDot className="mr-2 h-5 w-5" />
                  Deposit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Deposit Funds</DialogTitle>
                  <DialogDescription>
                    Send funds to an account below and enter the details to verify.
                  </DialogDescription>
                </DialogHeader>
                 
                <Form {...depositForm}>
                  <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-4">
                     <FormField
                        control={depositForm.control}
                        name="depositTo"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Select Admin Account</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="space-y-2"
                                >
                                {areWalletsLoading ? <p>Loading accounts...</p> : enabledDepositMethods?.map(wallet => (
                                    <FormItem key={wallet.id} className="flex items-center space-x-3 space-y-0 rounded-md border p-3 has-[:checked]:border-primary">
                                        <FormControl>
                                            <RadioGroupItem value={wallet.walletName} />
                                        </FormControl>
                                        <FormLabel className="font-normal w-full">
                                             <h4 className="font-semibold">{wallet.walletName}</h4>
                                             <p className="text-sm">Name: {wallet.accountHolderName}</p>
                                             <p className="text-sm">Number: {wallet.accountNumber}</p>
                                        </FormLabel>
                                    </FormItem>
                                ))}
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField control={depositForm.control} name="accountHolderName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Account Holder Name</FormLabel>
                          <FormControl><Input placeholder="Your Name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={depositForm.control} name="accountNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Account Number</FormLabel>
                          <FormControl><Input placeholder="03xxxxxxxxx" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={depositForm.control} name="amount" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (PKR)</FormLabel>
                           <FormControl><Input type="number" placeholder="Enter amount" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={depositForm.control} name="transactionId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction ID (TID)</FormLabel>
                          <FormControl><Input placeholder="e.g., 1234567890" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={areSettingsLoading}>Submit Request</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isWithdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="secondary" className="flex-1" disabled={noWithdrawalMethodsEnabled || areSettingsLoading}>
                  <ArrowUpFromDot className="mr-2 h-5 w-5" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>
                    Select your withdrawal method and enter your details.
                  </DialogDescription>
                </DialogHeader>
                <Form {...withdrawForm}>
                  <form onSubmit={withdrawForm.handleSubmit(onWithdrawSubmit)} className="space-y-6 pt-4">
                    <FormField control={withdrawForm.control} name="method" render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Select Method</FormLabel>
                           <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-4">
                                {appSettings?.withdrawalJazzCashEnabled && (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl><RadioGroupItem value="JazzCash" /></FormControl>
                                  <FormLabel className="font-normal">JazzCash</FormLabel>
                                </FormItem>
                                )}
                                {appSettings?.withdrawalEasypaisaEnabled && (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl><RadioGroupItem value="Easypaisa" /></FormControl>
                                  <FormLabel className="font-normal">Easypaisa</FormLabel>
                                </FormItem>
                                )}
                                {appSettings?.withdrawalBankEnabled && (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl><RadioGroupItem value="Bank" /></FormControl>
                                  <FormLabel className="font-normal">Bank Transfer</FormLabel>
                                </FormItem>
                                )}
                            </RadioGroup>
                           </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watchedWithdrawMethod === 'Bank' && (
                       <FormField control={withdrawForm.control} name="bankName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                           <FormControl><Input placeholder="e.g., HBL, Meezan Bank" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    )}
                    <FormField control={withdrawForm.control} name="accountHolderName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder Name</FormLabel>
                           <FormControl><Input placeholder="Your Name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={withdrawForm.control} name="accountNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number / IBAN</FormLabel>
                          <FormControl><Input placeholder="PK..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={withdrawForm.control} name="amount" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount to Withdraw (PKR)</FormLabel>
                          <FormControl><Input type="number" placeholder="Enter amount" {...field} /></FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={areSettingsLoading || (walletData?.balance ?? 0) < withdrawForm.getValues('amount')}>
                        {areSettingsLoading ? "Loading..." : "Submit Request"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
