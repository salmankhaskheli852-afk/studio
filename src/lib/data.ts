export type InvestmentPlan = {
  id: number;
  name: string;
  dailyReturn: number;
  period: number;
  minInvest: number;
  maxInvest: number;
};

export const investmentPlans: InvestmentPlan[] = [
  {
    id: 1,
    name: "Starter Plan",
    dailyReturn: 2.5,
    period: 30,
    minInvest: 1000,
    maxInvest: 10000,
  },
  {
    id: 2,
    name: "Pro Plan",
    dailyReturn: 3.5,
    period: 60,
    minInvest: 10001,
    maxInvest: 50000,
  },
  {
    id: 3,
    name: "Expert Plan",
    dailyReturn: 5.0,
    period: 90,
    minInvest: 50001,
    maxInvest: 200000,
  },
];

export type Transaction = {
  id: string;
  timestamp: string | Date | { seconds: number, nanoseconds: number }; // Allow Date object & Firestore Timestamp
  type: "Deposit" | "Withdrawal" | "Investment";
  amount: number;
  status: "Pending" | "Completed" | "Failed";
};

export type AdminWallet = {
    id: string;
    walletName: string;
    accountHolderName: string;
    accountNumber: string;
}

export type AppSettings = {
    id: string;
    minDeposit: number;
    maxDeposit: number;
    minWithdrawal: number;
    maxWithdrawal: number;
}
