"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownToDot, ArrowUpFromDot } from 'lucide-react';

export function WalletClient() {
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
            <Button size="lg" className="flex-1">
              <ArrowDownToDot className="mr-2 h-5 w-5" />
              Deposit
            </Button>
            <Button size="lg" variant="secondary" className="flex-1">
              <ArrowUpFromDot className="mr-2 h-5 w-5" />
              Withdraw
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
