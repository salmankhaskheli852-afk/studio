
'use client';

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { useState } from "react";

const bankAccountSchema = z.object({
  cardholderName: z.string().min(5, "Cardholder name must be 5-30 characters.").max(30, "Cardholder name must be 5-30 characters."),
  withdrawalMethod: z.string({ required_error: "Please select a withdrawal method." }),
  bankName: z.string().optional(),
  walletOrBankAccount: z.string().min(1, "Wallet or bank account is required."),
  idNumber: z.string().optional(),
  phoneNumber: z.string().regex(/^3\d{9}$/, "The wallet account must be an 11-digit number starting with 03."),
});

type BankAccount = z.infer<typeof bankAccountSchema> & { id: string };

export default function MyBankPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  const form = useForm<z.infer<typeof bankAccountSchema>>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      cardholderName: "",
      walletOrBankAccount: "",
      idNumber: "",
      phoneNumber: "",
    }
  });

  const withdrawalMethod = form.watch("withdrawalMethod");

  function onSubmit(values: z.infer<typeof bankAccountSchema>) {
    console.log(values);
    const newAccount: BankAccount = {
        id: new Date().getTime().toString(),
        ...values,
    };
    setAccounts(prev => [...prev, newAccount]);
    form.reset();
  }
  
  function deleteAccount(id: string) {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline">My Bank Accounts</h1>
        <p className="text-muted-foreground">Manage your bank accounts for withdrawals.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
            <Card>
                <CardHeader>
                    <CardTitle>Saved Accounts</CardTitle>
                    <CardDescription>Your saved bank accounts for withdrawals.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bank</TableHead>
                        <TableHead>Account Holder</TableHead>
                        <TableHead>Account Number</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No accounts saved yet.</TableCell>
                        </TableRow>
                      )}
                      {accounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="capitalize">{account.withdrawalMethod}</TableCell>
                          <TableCell>{account.cardholderName}</TableCell>
                          <TableCell>{account.walletOrBankAccount}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => deleteAccount(account.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                  <CardTitle>Add New Account</CardTitle>
                  <CardDescription>Add a new bank account for withdrawals.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField control={form.control} name="cardholderName" render={({ field }) => ( <FormItem> <FormLabel>Cardholder Name</FormLabel> <FormControl> <Input placeholder="Cardholder Name" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                      
                      <FormField control={form.control} name="withdrawalMethod" render={({ field }) => ( <FormItem> <FormLabel>Choose withdrawal method</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Choose withdrawal method" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="jazzcash">JazzCash</SelectItem> <SelectItem value="easypaisa">Easypaisa</SelectItem> <SelectItem value="bank">Bank Transfer</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                      
                      {withdrawalMethod === 'bank' && (
                        <FormField control={form.control} name="bankName" render={({ field }) => ( <FormItem> <FormLabel>Bank Name</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Please select the bank" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="meezan">Meezan Bank</SelectItem> <SelectItem value="hbl">HBL</SelectItem> <SelectItem value="ubl">UBL</SelectItem> <SelectItem value="mcb">MCB</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                      )}

                      <FormField control={form.control} name="walletOrBankAccount" render={({ field }) => ( <FormItem> <FormLabel>Wallet or bank account</FormLabel> <FormControl> <Input placeholder="Wallet or bank account" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                      
                      <FormField control={form.control} name="idNumber" render={({ field }) => ( <FormItem> <FormLabel>ID number</FormLabel> <FormControl> <Input placeholder="ID number (optional)" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />

                      <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600 h-10">+92</span>
                            <FormControl>
                                <Input className="rounded-l-none" placeholder="3112765988" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                          <p>* Cardholder name (5-30 characters).</p>
                          <p>* The wallet account is an 11-digit number starting with 03.</p>
                      </div>

                      <Button type="submit" className="w-full">Save bank</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
        </div>
      </div>
    </div>
  );
}
