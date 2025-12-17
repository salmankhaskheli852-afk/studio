'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ArrowDown, ArrowUp, TrendingUp, HelpCircle, AlertCircle } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, isLoading }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <Skeleton className="h-8 w-32" />
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
        </CardContent>
    </Card>
);


interface AdminStatsProps {
    isLoading: boolean;
    totalInvestments: number;
    totalDeposits: number;
    totalEarnings: number;
    totalWithdrawals: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
}

export function AdminStats({
    isLoading,
    totalInvestments,
    totalDeposits,
    totalEarnings,
    totalWithdrawals,
    pendingDeposits,
    pendingWithdrawals
}: AdminStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard 
                title="Total Investments" 
                value={`PKR ${totalInvestments.toLocaleString()}`}
                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
            />
            <StatCard 
                title="Total Deposits" 
                value={`PKR ${totalDeposits.toLocaleString()}`}
                icon={<ArrowDown className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
            />
            <StatCard 
                title="Total Earnings" 
                value={`PKR ${totalEarnings.toLocaleString()}`}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
            />
            <StatCard 
                title="Total Withdrawals" 
                value={`PKR ${totalWithdrawals.toLocaleString()}`}
                icon={<ArrowUp className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
            />
            <StatCard 
                title="Pending Deposits" 
                value={pendingDeposits.toString()}
                icon={<HelpCircle className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
            />
             <StatCard 
                title="Pending Withdrawals" 
                value={pendingWithdrawals.toString()}
                icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
            />
        </div>
    );
}
