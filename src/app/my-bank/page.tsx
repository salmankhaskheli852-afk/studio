'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from 'react';
import { adminWallets } from "@/lib/data";
import { Landmark } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/data";
import { useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, doc, runTransaction, increment, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const depositSchema = z.object({
  accountHolder: z.string().min(2, "Name is too short"),
  accountNumber: z.string().regex(/^(03\d{9})$/, "Enter a valid 11-digit number like 03001234567"),
  amount: z.coerce.number().min(100, "Minimum deposit is 100 PKR"),
  transactionId: z.string().min(5, "Transaction ID is required"),
});

const withdrawSchema = z.object({
  method: z.string({ required_error: "Please select a method." }),
  bankName: z.string().optional(),
  accountHolder: z.string().min(2, "Name is too short"),
  accountNumber: z.string().min(5, "Account number is required"),
  amount: z.coerce.number().min(500, "Minimum withdrawal is 500 PKR"),
});

const walletOptions = ['JazzCash', 'Easypaisa'];
const bankOptions = [
    "Allied Bank Limited",
    "Askari Bank",
    "Bank Alfalah",
    "Bank Al-Habib",
    "BankIslami Pakistan",
    "Bank of Punjab",
    "Dubai Islamic Bank",
    "Faysal Bank",
    "Habib Bank Limited",
    "JS Bank",
    "MCB Bank",
    "Meezan Bank",
    "National Bank of Pakistan",
    "Soneri Bank",
    "Standard Chartered Bank",
    "Summit Bank",
    "United Bank Limited",
];


export default function MyBankPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("recharge");
  const [withdrawalMethod, setWithdrawalMethod] = useState<'wallet' | 'bank'>('wallet');

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

  const depositForm = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      accountHolder: "",
      accountNumber: "",
      amount: 0,
      transactionId: "",
    }
  });

  const withdrawForm = useForm<z.infer<typeof withdrawSchema>>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
        method: "",
        bankName: "",
        accountHolder: "",
        accountNumber: "",
        amount: 0,
    },
  });

  async function onDepositSubmit(values: z.infer<typeof depositSchema>) {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to make a deposit." });
      return;
    }

    try {
      const transactionsColRef = collection(firestore, `users/${user.uid}/wallet/${user.uid}/transactions`);
      await addDoc(transactionsColRef, {
        walletId: user.uid, // Correct field name
        type: 'Deposit',
        status: 'Pending',
        timestamp: serverTimestamp(),
        amount: values.amount,
        accountHolderName: values.accountHolder,
        accountNumber: values.accountNumber,
        transactionId: values.transactionId,
      });

      toast({ title: "Deposit Submitted", description: "Your deposit request has been submitted and is pending approval." });
      depositForm.reset();
    } catch (error) {
      console.error("Error submitting deposit:", error);
      toast({ variant: "destructive", title: "Submission Failed", description: "An error occurred while submitting your deposit." });
    }
  }

  async function onWithdrawSubmit(values: z.infer<typeof withdrawSchema>) {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to make a withdrawal." });
      return;
    }

    const currentBalance = walletData?.balance ?? 0;
    if (currentBalance < values.amount) {
        toast({ variant: "destructive", title: "Insufficient Balance", description: "You do not have enough funds for this withdrawal." });
        return;
    }

    try {
        await runTransaction(firestore, async (transaction) => {
            const walletRef = doc(firestore, `users/${user.uid}/wallet`, user.uid);
            const transactionsColRef = collection(firestore, `users/${user.uid}/wallet/${user.uid}/transactions`);

            // 1. Deduct balance immediately
            transaction.update(walletRef, { balance: increment(-values.amount) });

            // 2. Create pending withdrawal transaction
            const newTransactionRef = doc(transactionsColRef); // create a reference to get the ID
            transaction.set(newTransactionRef, {
                ...values,
                type: 'Withdrawal',
                status: 'Pending',
                amount: -values.amount, // Store as negative
                timestamp: serverTimestamp(),
                walletId: user.uid,
            });
        });

        toast({ title: "Withdrawal Submitted", description: "Your withdrawal request has been submitted." });
        withdrawForm.reset();
    } catch (error) {
        console.error("Error submitting withdrawal:", error);
        toast({ variant: "destructive", title: "Submission Failed", description: "An error occurred while submitting your withdrawal." });
    }
  }
  
  const currentOptions = withdrawalMethod === 'wallet' ? walletOptions : bankOptions;

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
        <Tabs defaultValue="recharge" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recharge">Recharge</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            </TabsList>
            <TabsContent value="recharge">
            <div className="grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-xl font-semibold font-headline">Admin Wallets</h2>
                  <p className="text-sm text-muted-foreground">Please send your deposit amount to one of the following accounts.</p>
                  {adminWallets.map(wallet => (
                    <Card key={wallet.name}>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <Landmark className="w-8 h-8 text-primary"/>
                            <div className="grid gap-1">
                                <CardTitle>{wallet.name}</CardTitle>
                                <CardDescription>{wallet.accountName}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-mono tracking-wider">{wallet.accountNumber}</p>
                        </CardContent>
                    </Card>
                  ))}
              </div>
              <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                    <CardTitle>Deposit Funds</CardTitle>
                    <CardDescription>Fill the form after sending payment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Form {...depositForm}>
                        <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-4">
                        <FormField control={depositForm.control} name="accountHolder" render={({ field }) => ( <FormItem> <FormLabel>Your Account Name</FormLabel> <FormControl> <Input placeholder="e.g. John Doe" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={depositForm.control} name="accountNumber" render={({ field }) => ( <FormItem> <FormLabel>Your Account Number</FormLabel> <FormControl> <Input placeholder="e.g. 03001234567" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={depositForm.control} name="amount" render={({ field }) => ( <FormItem> <FormLabel>Amount (PKR)</FormLabel> <FormControl> <Input type="number" placeholder="1000" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={depositForm.control} name="transactionId" render={({ field }) => ( <FormItem> <FormLabel>Transaction ID (TID)</FormLabel> <FormControl> <Input placeholder="Enter the TID from your payment app" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                        <Button type="submit" className="w-full">Submit Deposit</Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>
              </div>
            </div>
            </TabsContent>
            <TabsContent value="withdraw">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                <CardTitle>Request Withdrawal</CardTitle>
                <CardDescription>Fill in the details below to request a withdrawal.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...withdrawForm}>
                    <form onSubmit={withdrawForm.handleSubmit(onWithdrawSubmit)} className="space-y-4">
                     <FormField
                        control={withdrawForm.control}
                        name="method"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Choose withdrawal method</FormLabel>
                             <Select onValueChange={(value: 'wallet' | 'bank') => {
                                field.onChange(value);
                                setWithdrawalMethod(value);
                                withdrawForm.setValue('bankName', '');
                            }} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a method" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="wallet">Wallet account (Jazzcash/Easypaisa)</SelectItem>
                                    <SelectItem value="bank">Bank account</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={withdrawForm.control}
                        name="bankName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Please select</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={`Select a ${withdrawalMethod === 'wallet' ? 'wallet' : 'bank'}`} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {currentOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                    {option}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                    <FormField control={withdrawForm.control} name="accountHolder" render={({ field }) => ( <FormItem> <FormLabel>Account Holder Name</FormLabel> <FormControl> <Input placeholder="Your full name" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={withdrawForm.control} name="accountNumber" render={({ field }) => ( <FormItem> <FormLabel>Account/Wallet Number</FormLabel> <FormControl> <Input placeholder="e.g. 03001234567 or Bank Account No." {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={withdrawForm.control} name="amount" render={({ field }) => ( <FormItem> <FormLabel>Amount (PKR)</FormLabel> <FormControl> <Input type="number" placeholder="500" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                   
                    <Button type="submit" className="w-full" disabled={isWalletLoading}>
                        {isWalletLoading ? 'Checking balance...' : 'Request Withdrawal'}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            </TabsContent>
        </Tabs>

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
  

  

    