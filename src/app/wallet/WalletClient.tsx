"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/data";
import { Landmark } from "lucide-react";

const depositSchema = z.object({
  accountHolder: z.string().min(2, "Name is too short"),
  accountNumber: z.string().regex(/^(03\d{9})$/, "Enter a valid 11-digit number like 03001234567"),
  amount: z.coerce.number().min(100, "Minimum deposit is 100 PKR"),
  transactionId: z.string().min(5, "Transaction ID is required"),
});

const withdrawSchema = z.object({
  method: z.string({ required_error: "Please select a method." }),
  accountHolder: z.string().min(2, "Name is too short"),
  accountNumber: z.string().regex(/^(03\d{9})$/, "Enter a valid 11-digit number like 03001234567"),
  amount: z.coerce.number().min(500, "Minimum withdrawal is 500 PKR"),
});

type WalletClientProps = {
  transactions: Transaction[];
  adminWallets: { name: string; accountName: string; accountNumber: string }[];
};

export function WalletClient({ transactions, adminWallets }: WalletClientProps) {
  const depositForm = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      accountHolder: "",
      accountNumber: "",
      transactionId: "",
    }
  });
  const withdrawForm = useForm<z.infer<typeof withdrawSchema>>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
        accountHolder: "",
        accountNumber: "",
    }
  });

  function onDepositSubmit(values: z.infer<typeof depositSchema>) {
    console.log(values);
    // Handle deposit logic
  }

  function onWithdrawSubmit(values: z.infer<typeof withdrawSchema>) {
    console.log(values);
    // Handle withdraw logic
  }
  
  const getStatusBadgeVariant = (status: Transaction["status"]) => {
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
        <h1 className="text-3xl font-bold tracking-tight font-headline">Wallet</h1>
        <p className="text-muted-foreground">Manage your funds and view your transaction history.</p>
      </header>

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
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            </TabsList>
            <TabsContent value="deposit">
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
            </TabsContent>
            <TabsContent value="withdraw">
              <Card>
                <CardHeader>
                  <CardTitle>Withdraw Funds</CardTitle>
                  <CardDescription>Request a withdrawal to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...withdrawForm}>
                    <form onSubmit={withdrawForm.handleSubmit(onWithdrawSubmit)} className="space-y-4">
                      <FormField control={withdrawForm.control} name="method" render={({ field }) => ( <FormItem> <FormLabel>Withdrawal Method</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select a method" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="jazzcash">JazzCash</SelectItem> <SelectItem value="easypaisa">Easypaisa</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                      <FormField control={withdrawForm.control} name="accountHolder" render={({ field }) => ( <FormItem> <FormLabel>Account Holder Name</FormLabel> <FormControl> <Input placeholder="e.g. John Doe" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                      <FormField control={withdrawForm.control} name="accountNumber" render={({ field }) => ( <FormItem> <FormLabel>Account Number</FormLabel> <FormControl> <Input placeholder="e.g. 03001234567" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                      <FormField control={withdrawForm.control} name="amount" render={({ field }) => ( <FormItem> <FormLabel>Amount (PKR)</FormLabel> <FormControl> <Input type="number" placeholder="500" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                      <Button type="submit" className="w-full">Request Withdrawal</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>A record of your recent deposits and withdrawals.</CardDescription>
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
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(transaction.status)}>{transaction.status}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-emerald-600' : 'text-destructive'}`}>{transaction.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
