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
  pleaseSelect: z.string({ required_error: 'Please select an option.'}),
  accountNumber: z.string().min(1, "Account number is required."),
  idNumber: z.string().min(1, "ID number is required."),
  phoneNumber: z.string().regex(/^03\d{9}$/, 'The wallet account must be an 11-digit number starting with 03.'),
});

const bankOptions = [
    "ALLIED BANK LTD.",
    "ALBARAKA BANK (PAKISTAN) LTD.",
    "ALFALAH BANK LTD.",
    "ASKARI BANK LTD.",
    "BANK AL-HABIB LTD.",
    "BANK ISLAMI PAKISTAN LTD.",
    "BANK OF PUNJAB",
    "DUBAI ISLAMIC BANK PAKISTAN LTD.",
    "FAYSAL BANK LTD.",
    "FINCA Micro Finance Bank",
    "FIRST WOMEN BANK LTD.",
    "HABIB BANK LTD.",
    "Mobilink Micro Finance Bank (JAZZCASH)",
    "JS BANK LTD.",
    "BANK OF KHYBER",
    "MCB Islamic Bank Limited",
    "MEEZAN BANK LTD.",
    "HABIB METROPOLITAN BANK LTD."
];

const walletOptions = ["JazzCash", "Easypaisa"];

export default function MyBankPage() {

  const form = useForm<z.infer<typeof bankAccountSchema>>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      cardholderName: '',
      accountNumber: '',
      idNumber: '',
      phoneNumber: '',
    },
  });

  const withdrawalMethod = form.watch('withdrawalMethod');

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
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      form.resetField('pleaseSelect');
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose withdrawal method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bank">Bank account</SelectItem>
                        <SelectItem value="wallet">Wallet account</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pleaseSelect"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value} key={withdrawalMethod}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {withdrawalMethod === 'bank' && bankOptions.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                        {withdrawalMethod === 'wallet' && walletOptions.map(wallet => (
                            <SelectItem key={wallet} value={wallet}>{wallet}</SelectItem>
                        ))}
                         {withdrawalMethod !== 'bank' && withdrawalMethod !== 'wallet' && (
                            <SelectItem value="jazzcash">JazzCash</SelectItem>
                         )}
                         {withdrawalMethod !== 'bank' && withdrawalMethod !== 'wallet' && (
                            <SelectItem value="easypaisa">Easypaisa</SelectItem>
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

              <div className="text-xs text-muted-foreground space-y-1 pt-2">
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
