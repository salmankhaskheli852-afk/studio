export type InvestmentPlan = {
  id: string; // Changed to string for Firestore
  name: string;
  categoryId: string; // Added categoryId
  dailyReturn: number;
  period: number;
  minInvest: number;
  maxInvest: number;
};

export type InvestmentCategory = {
    id: string;
    name: string;
    description: string;
}

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
