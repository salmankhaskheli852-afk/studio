'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { investmentPlans } from "@/lib/data";
import type { InvestmentPlan } from "@/lib/data";
import { PiggyBank, Zap, BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

const planIcons = [
  <PiggyBank key="1" className="h-8 w-8 text-primary" />,
  <Zap key="2" className="h-8 w-8 text-primary" />,
  <BarChart3 key="3" className="h-8 w-8 text-primary" />
];

export default function InvestPage() {
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);

  const handleInvestClick = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
  };

  const totalReturn = selectedPlan ? ((selectedPlan.minInvest * selectedPlan.dailyReturn) / 100) * selectedPlan.period : 0;
  const dailyIncomeForSelected = selectedPlan ? (selectedPlan.minInvest * selectedPlan.dailyReturn) / 100 : 0;


  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Investment Plans</h1>
        <p className="text-muted-foreground">Choose a plan that suits your financial goals.</p>
      </header>
      
      <Dialog>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {investmentPlans.map((plan, index) => {
            const dailyIncome = (plan.minInvest * plan.dailyReturn) / 100;
            
            return (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {planIcons[index]}
                    <div>
                      <CardTitle className="font-headline">{plan.name}</CardTitle>
                      <CardDescription>Earn {plan.dailyReturn}% daily</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="flex justify-between border-t pt-4">
                    <span className="text-muted-foreground">Term</span>
                    <span className="font-semibold">{plan.period} days</span>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <span className="text-muted-foreground">Plan Price</span>
                    <span className="font-semibold">PKR {plan.minInvest.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <span className="text-muted-foreground">Daily Income</span>
                    <span className="font-semibold">PKR {dailyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => handleInvestClick(plan)}>Invest Now</Button>
                  </DialogTrigger>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {selectedPlan && (
            <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedPlan.name}</DialogTitle>
                <DialogDescription>
                Confirm your investment in this plan.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                 <div className="flex justify-between border-t pt-4">
                    <span className="text-muted-foreground">Plan Price</span>
                    <span className="font-semibold">PKR {selectedPlan.minInvest.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-4">
                    <span className="text-muted-foreground">Daily Income</span>
                    <span className="font-semibold">PKR {dailyIncomeForSelected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                 <div className="flex justify-between border-t pt-4">
                    <span className="text-muted-foreground">Term</span>
                    <span className="font-semibold">{selectedPlan.period} days</span>
                </div>
                <div className="flex justify-between border-t pt-4 text-lg">
                    <span className="text-muted-foreground">Total Return</span>
                    <span className="font-bold text-primary">PKR {totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="secondary">Cancel</Button>
                <Button type="button">Confirm Investment</Button>
            </DialogFooter>
            </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
