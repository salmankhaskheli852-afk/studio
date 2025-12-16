'use client';

import { useForm, Controller } from 'react-hook-form';
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
import { useState } from 'react';

const depositSchema = z.object({
  accountHolder: z.string().min(2, "Name is too short"),
  accountNumber: z.string().regex(/^(03\d{9})$/, "Enter a valid 11-digit number like 03001234567"),
  amount: z.coerce.number().min(100, "Minimum deposit is 100 PKR"),
  transactionId: z.string().min(5, "Transaction ID is required"),
});

const bankAccountSchema = z.object({
  cardholderName: z.string().min(2, 'Cardholder name is required'),
  withdrawalMethod: z.enum(['wallet', 'bank']),
  bankName: z.string().optional(),
  idNumber: z.string().min(5, 'ID number is required'),
  phoneNumber: z.string().regex(/^(03\d{9})$/, "Enter a valid 11-digit number like 03001234567"),
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
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const depositForm = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      accountHolder: "",
      accountNumber: "",
      transactionId: "",
    }
  });

  const bankForm = useForm<z.infer<typeof bankAccountSchema>>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      cardholderName: '',
      idNumber: '',
      phoneNumber: '',
    },
  });

  function onDepositSubmit(values: z.infer<typeof depositSchema>) {
    console.log(values);
    // Handle deposit logic
  }

  function onBankSubmit(values: z.infer<typeof bankAccountSchema>) {
    console.log(values);
  }
  
  const handleMethodChange = (value: string) => {
    setSelectedMethod(value);
    bankForm.setValue('bankName', '');
  };

  const currentOptions = selectedMethod === 'wallet' ? walletOptions : bankOptions;

  return (
    <div className="space-y-6">
        <Tabs defaultValue="recharge" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recharge">Recharge</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            </TabsList>
            <TabsContent value="recharge">
            <Card>
                <CardHeader>
                <CardTitle>Deposit Funds</CardTitle>
                <CardDescription>Fill the form after sending payment.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...depositForm}>
                    <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-4">
                    <FormField
                      control={depositForm.control}
                      name="accountHolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Account Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={depositForm.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 03001234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={depositForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (PKR)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="1000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={depositForm.control}
                      name="transactionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction ID (TID)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter the TID from your payment app" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">Submit Deposit</Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="withdraw">
            <Card>
                <CardHeader>
                <CardTitle>Add New Bank Account</CardTitle>
                <CardDescription>Fill in the details below to add a new withdrawal method.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...bankForm}>
                    <form onSubmit={bankForm.handleSubmit(onBankSubmit)} className="space-y-4">
                    <FormField
                        control={bankForm.control}
                        name="cardholderName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cardholder Name</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={bankForm.control}
                        name="withdrawalMethod"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Choose withdrawal method</FormLabel>
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                handleMethodChange(value);
                            }} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a method" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="wallet">Wallet account</SelectItem>
                                <SelectItem value="bank">Bank account</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {selectedMethod && (
                        <FormField
                        control={bankForm.control}
                        name="bankName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Please select</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={`Select a ${selectedMethod === 'wallet' ? 'wallet' : 'bank'}`} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {currentOptions.map((option) => (
                                    <SelectItem key={option} value={option.toLowerCase().replace(/ /g, '_')}>
                                    {option}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    )}

                    <FormField
                        control={bankForm.control}
                        name="idNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>ID Number</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter your account/wallet number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={bankForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <Input placeholder="03001234567" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full">
                        Add Account
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
