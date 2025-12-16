
'use client';

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { useState } from "react";

const bankAccountSchema = z.object({
  bankName: z.string({ required_error: "Please select a bank." }),
  accountHolder: z.string().min(2, "Name is too short"),
  accountNumber: z.string().min(11, "Enter a valid account number"),
});

type BankAccount = z.infer<typeof bankAccountSchema> & { id: string };

export default function MyBankPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([
    { id: '1', bankName: 'jazzcash', accountHolder: 'John Doe', accountNumber: '03001234567' },
  ]);

  const form = useForm<z.infer<typeof bankAccountSchema>>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      accountHolder: "",
      accountNumber: "",
    }
  });

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
                      {accounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="capitalize">{account.bankName.replace('-', ' ')}</TableCell>
                          <TableCell>{account.accountHolder}</TableCell>
                          <TableCell>{account.accountNumber}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => deleteAccount(account.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {accounts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No accounts saved yet.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                  <CardTitle>Add New Account</CardTitle>
                  <CardDescription>Add a new bank account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField control={form.control} name="bankName" render={({ field }) => ( <FormItem> <FormLabel>Bank</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select a bank" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="jazzcash">JazzCash</SelectItem> <SelectItem value="easypaisa">Easypaisa</SelectItem> <SelectItem value="meezan">Meezan Bank</SelectItem> <SelectItem value="hbl">HBL</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                      <FormField control={form.control} name="accountHolder" render={({ field }) => ( <FormItem> <FormLabel>Account Holder Name</FormLabel> <FormControl> <Input placeholder="e.g. John Doe" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                      <FormField control={form.control} name="accountNumber" render={({ field }) => ( <FormItem> <FormLabel>Account Number</FormLabel> <FormControl> <Input placeholder="e.g. 03001234567" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                      <Button type="submit" className="w-full">Add Account</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
        </div>
      </div>
    </div>
  );
}
