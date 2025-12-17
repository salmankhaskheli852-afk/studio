
export type InvestmentPlan = {
  id: string;
  name: string;
  categoryId: string;
  dailyReturn: number;
  period: number;
  minInvest: number;
  imageUrl?: string;
};

export type InvestmentCategory = {
    id: string;
    name: string;
    description: string;
}

export type Transaction = {
  id: string;
  timestamp: string | Date | { seconds: number, nanoseconds: number };
  type: "Deposit" | "Withdrawal" | "Investment";
  amount: number;
  status: "Pending" | "Completed" | "Failed";
  method?: 'JazzCash' | 'Easypaisa' | 'Bank'; // Added for withdrawal
  bankName?: string; // Added for bank withdrawal
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
    maintenanceMode: boolean;
    maintenanceMessage: string;
    investmentsEnabled: boolean;
    depositJazzCashEnabled: boolean;
    depositEasypaisaEnabled: boolean;
    withdrawalJazzCashEnabled: boolean;
    withdrawalEasypaisaEnabled: boolean;
    withdrawalBankEnabled: boolean;
    customerCareWhatsapp?: string;
    websiteUrl?: string;
}

    