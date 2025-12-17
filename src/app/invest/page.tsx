'use client';

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiggyBank, Zap, BarChart3, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { collection, doc, updateDoc, arrayUnion, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import type { InvestmentCategory, InvestmentPlan, AppSettings } from "@/lib/data";

const planIcons = {
  default: <TrendingUp className="h-8 w-8 text-primary" />,
  starter: <PiggyBank className="h-8 w-8 text-primary" />,
  pro: <Zap className="h-8 w-8 text-primary" />,
  expert: <BarChart3 className="h-8 w-8 text-primary" />,
};

const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('starter')) return planIcons.starter;
    if (name.includes('pro')) return planIcons.pro;
    if (name.includes('expert')) return planIcons.expert;
    return planIcons.default;
}

export default function InvestPage() {
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'investment_categories') : null, [firestore]);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<InvestmentCategory>(categoriesQuery);

  const plansQuery = useMemoFirebase(() => firestore ? collection(firestore, 'investment_plans') : null, [firestore]);
  const { data: plans, isLoading: arePlansLoading } = useCollection<InvestmentPlan>(plansQuery);

  const walletDocRef = useMemoFirebase(
    () => (user ? doc(firestore, `users/${user.uid}/wallet`, user.uid) : null),
    [firestore, user]
  );
  const { data: walletData, isLoading: isWalletLoading } = useDoc(walletDocRef);

  const appSettingsDocRef = useMemoFirebase(
    () => firestore ? doc(firestore, 'app_settings', 'global') : null,
    [firestore]
  );
  const { data: appSettings, isLoading: areSettingsLoading } = useDoc<AppSettings>(appSettingsDocRef);

  const handleInvestClick = (plan: InvestmentPlan) => {
    if ((walletData?.balance ?? 0) < plan.minInvest) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "You do not have enough funds to purchase this plan.",
      });
      return;
    }
    setSelectedPlan(plan);
    setIsDialogOpen(true);
  };

  const handleConfirmInvestment = async () => {
    if (!user || !selectedPlan || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "Could not process investment. User or plan not found." });
      return;
    }

    const walletRef = doc(firestore, `users/${user.uid}/wallet`, user.uid);
    const transactionsColRef = collection(firestore, `users/${user.uid}/wallet/${user.uid}/transactions`);

    try {
      // 1. Create investment transaction
      await addDoc(transactionsColRef, {
        type: 'Investment',
        amount: -selectedPlan.minInvest,
        status: 'Completed',
        timestamp: serverTimestamp(),
        walletId: user.uid,
        details: `Investment in ${selectedPlan.name}`
      });

      // 2. Deduct balance from wallet
      await updateDoc(walletRef, {
        balance: increment(-selectedPlan.minInvest),
      });

      // 3. Add investment to user's profile
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, {
        investments: arrayUnion({
          planId: selectedPlan.id,
          name: selectedPlan.name,
          amount: selectedPlan.minInvest,
          startDate: new Date().toISOString(),
        }),
      });

      toast({
        title: "Investment Successful!",
        description: `You have successfully invested in the ${selectedPlan.name}.`,
      });
    } catch (error) {
      console.error("Error purchasing investment:", error);
      toast({
        variant: "destructive",
        title: "Investment Failed",
        description: "An error occurred while processing your investment.",
      });
    } finally {
      setIsDialogOpen(false);
    }
  };

  const totalReturn = selectedPlan ? ((selectedPlan.minInvest * selectedPlan.dailyReturn) / 100) * selectedPlan.period : 0;
  const dailyIncomeForSelected = selectedPlan ? (selectedPlan.minInvest * selectedPlan.dailyReturn) / 100 : 0;
  
  const isLoading = areCategoriesLoading || arePlansLoading || areSettingsLoading;
  const investmentsDisabled = appSettings?.investmentsEnabled === false;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Investment Plans</h1>
        <p className="text-muted-foreground">Choose a plan that suits your financial goals.</p>
      </header>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : categories && categories.length > 0 ? (
        <Tabs defaultValue={categories[0].id} className="w-full">
            <TabsList>
                {categories.map(category => (
                    <TabsTrigger key={category.id} value={category.id}>{category.name}</TabsTrigger>
                ))}
            </TabsList>
            
            {categories.map(category => (
                <TabsContent key={category.id} value={category.id}>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
                        {plans?.filter(p => p.categoryId === category.id).map((plan) => {
                            const dailyIncome = (plan.minInvest * plan.dailyReturn) / 100;
                            return (
                                <Card key={plan.id} className="flex flex-col overflow-hidden">
                                <div className="relative h-40 w-full">
                                    <Image 
                                        src={plan.imageUrl || `https://picsum.photos/seed/${plan.id}/600/400`}
                                        alt={plan.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover"
                                        data-ai-hint="investment money"
                                    />
                                </div>
                                <CardHeader>
                                  <div className="flex items-center gap-4">
                                    {getPlanIcon(plan.name)}
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
                                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => handleInvestClick(plan)} disabled={investmentsDisabled}>Invest Now</Button>
                                </CardFooter>
                              </Card>
                            )
                        })}
                         {plans?.filter(p => p.categoryId === category.id).length === 0 && (
                            <p className="text-muted-foreground col-span-3 text-center py-8">No plans available in this category yet.</p>
                         )}
                    </div>
                </TabsContent>
            ))}
        </Tabs>
      ) : (
          <p className="text-muted-foreground text-center py-12">No investment categories have been set up by the admin yet.</p>
      )}

      {selectedPlan && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedPlan.name}</DialogTitle>
              <DialogDescription>Confirm your investment in this plan.</DialogDescription>
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
              <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleConfirmInvestment} disabled={isWalletLoading}>
                {isWalletLoading ? 'Checking balance...' : 'Confirm Investment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    