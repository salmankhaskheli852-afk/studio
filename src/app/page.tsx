'use client';

import { useMemo } from 'react';
import { useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where, Timestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { DashboardStats } from "@/components/DashboardStats";
import { AdvertisementCard } from '@/components/AdvertisementCard';
import { WelcomePopup } from '@/components/WelcomePopup';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, "users", user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

  const walletDocRef = useMemoFirebase(
    () => (user ? doc(firestore, `users/${user.uid}/wallet`, user.uid) : null),
    [firestore, user]
  );
  const { data: walletData, isLoading: isWalletLoading } = useDoc(walletDocRef);

  const transactionsQuery = useMemoFirebase(
    () => (user ? collection(firestore, `users/${user.uid}/wallet/${user.uid}/transactions`) : null),
    [firestore, user]
  );
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection(transactionsQuery);

  const isLoading = isUserLoading || isUserDocLoading || isWalletLoading || isLoadingTransactions;

  const balance = walletData?.balance ?? 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Timestamp.fromDate(today);

  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalWithdraw = 0;
    let totalRecharge = 0;
    let todaysIncome = 0;

    transactions?.forEach(t => {
      if (t.status === 'Completed') {
        if (t.type === 'Investment') {
          totalIncome += t.amount;
          if ((t.timestamp as Timestamp).toDate() >= today) {
            todaysIncome += t.amount;
          }
        } else if (t.type === 'Withdrawal') {
          totalWithdraw += Math.abs(t.amount);
        } else if (t.type === 'Deposit') {
          totalRecharge += t.amount;
        }
      }
    });

    return { totalIncome, totalWithdraw, totalRecharge, todaysIncome };
  }, [transactions, today]);
  
  const totalAssets = balance + (userData?.investments?.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0) ?? 0);
  const teamIncome = userData?.referrals?.length ?? 0; // Placeholder, assuming team income is based on referral count.

  return (
    <div className="space-y-6">
      <WelcomePopup />
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome to InvestPro</h1>
        <p className="text-muted-foreground">Your dashboard for financial growth.</p>
      </header>

      <DashboardStats
        isLoading={isLoading}
        balanceWallet={balance}
        rechargeWallet={stats.totalRecharge}
        totalIncome={stats.totalIncome}
        totalWithdraw={stats.totalWithdraw}
        totalRecharge={stats.totalRecharge}
        todaysIncome={stats.todaysIncome}
        totalAssets={totalAssets}
        teamIncome={teamIncome}
      />
      
      <AdvertisementCard />

    </div>
  );
}
