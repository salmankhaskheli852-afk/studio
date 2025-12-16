
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { collection, addDoc, serverTimestamp, doc, runTransaction, increment } from 'firebase/firestore';
import type { adminWallets as AdminWalletType } from "@/lib/data";
import { adminWallets } from '@/lib/data';


// Deposit Schema
const depositSchema = z.object({
  accountHolderName: z.string().min(3, 'Name must be at least 3 characters.'),
  accountNumber: z.string().min(11, 'Please enter a valid account number.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  transactionId: z.string().min(5, 'Please enter a valid Transaction ID (TID).'),
});

// Withdraw Schema
const withdrawSchema = z.object({
  method: z.enum(['JazzCash', 'Easypaisa'], {
    required_error: 'You need to select a withdrawal method.',
  }),
  accountHolderName: z.string().min(3, 'Name must be at least 3 characters.'),
  accountNumber: z.string().min(11, 'Please enter a valid account number.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
});


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
  const { data: walletData, isLoading: isWalletLoading } = useDoc(walletDocRef);

  const depositForm = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      accountHolderName: '',
      accountNumber: '',
      amount: 0,
      transactionId: '',
    },
  });

  const withdrawForm = useForm<z.infer<typeof withdrawSchema>>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      accountHolderName: '',
      accountNumber: '',
      amount: 0,
    },
  });

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
            
            // 1. Deduct balance from wallet
            transaction.update(walletRef, { balance: increment(-values.amount) });
            
            // 2. Create withdrawal transaction record
            const newTransactionRef = doc(transactionsColRef); // Create a new doc ref to add
            transaction.set(newTransactionRef, {
                ...values,
                amount: -values.amount, // Store as negative
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
            {/* Deposit Button & Dialog */}
            <Dialog open={isDepositOpen} onOpenChange={setDepositOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="flex-1">
                  <ArrowDownToDot className="mr-2 h-5 w-5" />
                  Deposit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Deposit Funds</DialogTitle>
                  <DialogDescription>
                    Send funds to the accounts below and enter the details to verify.
                  </DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                    {adminWallets.map(wallet => (
                         <div key={wallet.name} className="p-3 rounded-md border bg-muted/50">
                             <h4 className="font-semibold">{wallet.name}</h4>
                             <p className="text-sm">Name: {wallet.accountName}</p>
                             <p className="text-sm">Number: {wallet.accountNumber}</p>
                         </div>
                    ))}
                 </div>
                <Form {...depositForm}>
                  <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-4">
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
                      <Button type="submit">Submit Request</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Withdraw Button & Dialog */}
            <Dialog open={isWithdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="secondary" className="flex-1">
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
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl><RadioGroupItem value="JazzCash" /></FormControl>
                                  <FormLabel className="font-normal">JazzCash</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl><RadioGroupItem value="Easypaisa" /></FormControl>
                                  <FormLabel className="font-normal">Easypaisa</FormLabel>
                                </FormItem>
                            </RadioGroup>
                           </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                          <FormLabel>Account Number</FormLabel>
                          <FormControl><Input placeholder="03xxxxxxxxx" {...field} /></FormControl>
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
                      <Button type="submit" disabled={isWalletLoading}>{isWalletLoading ? "Checking..." : "Submit Request"}</Button>
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

    