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
  timestamp: string | Date; // Allow Date object
  type: "Deposit" | "Withdrawal" | "Investment";
  amount: number;
  status: "Pending" | "Completed" | "Failed";
};

export const transactions: Transaction[] = [
  {
    id: "txn_1",
    timestamp: "2024-07-28T10:00:00Z",
    type: "Deposit",
    amount: 5000,
    status: "Completed",
  },
  {
    id: "txn_2",
    timestamp: "2024-07-27T11:00:00Z",
    type: "Investment",
    amount: -1000,
    status: "Completed",
  },
  {
    id: "txn_3",
    timestamp: "2024-07-26T12:00:00Z",
    type: "Withdrawal",
    amount: -500,
    status: "Pending",
  },
  {
    id: "txn_4",
    timestamp: "2024-07-25T13:00:00Z",
    type: "Deposit",
    amount: 2000,
    status: "Completed",
  },
  {
    id: "txn_5",
    timestamp: "2024-07-24T14:00:00Z",
    type: "Withdrawal",
    amount: -1000,
    status: "Failed",
  },
];

export const adminWallets = [
  {
    name: "JazzCash",
    accountName: "Admin Name",
    accountNumber: "0300-1234567",
  },
  {
    name: "Easypaisa",
    accountName: "Admin Name",
    accountNumber: "0345-7654321",
  },
];
