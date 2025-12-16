'use client';

import { useState } from 'react';
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

const bankAccountSchema = z.object({
  cardholderName: z.string().min(5, "Cardholder name must be between 5 and 30 characters.").max(30, "Cardholder name must be between 5 and 30 characters."),
  withdrawalMethod: z.string({ required_error: 'Please select a withdrawal method.' }),
  walletOrBank: z.string().optional(),
  accountNumber: z.string().regex(/^03\d{9}$/, 'The wallet account must be an 11-digit number starting with 03.'),
  idNumber: z.string().min(1, "ID number is required."),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number.'),
});

export default function MyBankPage() {
  const [withdrawalMethod, setWithdrawalMethod] = useState('');

  const form = useForm<z.infer<typeof bankAccountSchema>>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      cardholderName: '',
      accountNumber: '',
      idNumber: '',
      phoneNumber: '',
    },
  });

  function onSubmit(values: z.infer<typeof bankAccountSchema>) {
    console.log(values);
    // Handle form submission
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline">My Bank Accounts</h1>
        <p className="text-muted-foreground">Add or manage your bank accounts for withdrawals.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Add New Bank Account</CardTitle>
          <CardDescription>Fill in the details below to add a new withdrawal method.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
              <FormField
                control={form.control}
                name="cardholderName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Cardholder Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="withdrawalMethod"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={(value) => { field.onChange(value); setWithdrawalMethod(value); }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose withdrawal method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="jazzcash">JazzCash</SelectItem>
                        <SelectItem value="easypaisa">Easypaisa</SelectItem>
                        <SelectItem value="bank">Bank Account</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="walletOrBank"
                render={({ field }) => (
                  <FormItem>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!withdrawalMethod}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={withdrawalMethod ? `Select ${withdrawalMethod === 'bank' ? 'Bank' : 'Wallet'}` : "Please select the withdrawal method first"} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {withdrawalMethod === 'bank' ? (
                                <>
                                    <SelectItem value="meezan">Meezan Bank</SelectItem>
                                    <SelectItem value="hbl">HBL</SelectItem>
                                    <SelectItem value="ubl">UBL</SelectItem>
                                </>
                            ) : (
                                <>
                                    <SelectItem value="jazzcash_wallet">JazzCash Wallet</SelectItem>
                                    <SelectItem value="easypaisa_wallet">Easypaisa Wallet</SelectItem>
                                </>
                            )}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Wallet or bank account" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="ID number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center gap-2">
                           <div className="h-10 flex items-center justify-center rounded-md border border-input bg-background px-3 text-sm">
                                +92
                           </div>
                           <FormControl>
                                <Input placeholder="3112765988" {...field} />
                           </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
                />


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
  );
}
