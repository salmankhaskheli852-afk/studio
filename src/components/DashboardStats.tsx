'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatItemProps {
    label: string;
    value: string | number;
    isLoading: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, isLoading }) => (
    <div className="text-center">
        <p className="text-sm text-white/80">{label}</p>
        {isLoading ? (
            <Skeleton className="h-6 w-16 mx-auto mt-1 bg-white/20" />
        ) : (
            <p className="text-lg font-bold text-white">{value}</p>
        )}
    </div>
);

interface DashboardStatsProps {
    isLoading: boolean;
    balanceWallet: number;
    rechargeWallet: number;
    totalIncome: number;
    totalWithdraw: number;
    totalRecharge: number;
    todaysIncome: number;
    totalAssets: number;
    teamIncome: number;
}

export function DashboardStats({
    isLoading,
    balanceWallet,
    rechargeWallet,
    totalIncome,
    totalWithdraw,
    totalRecharge,
    todaysIncome,
    totalAssets,
    teamIncome,
}: DashboardStatsProps) {
    return (
        <Card className="w-full overflow-hidden bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg">
            <CardContent className="p-0 text-white">
                <div className="relative p-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-sm font-light text-white/90">Balance wallet</p>
                            {isLoading ? (
                                <Skeleton className="h-8 w-32 mx-auto mt-1 bg-white/20" />
                            ) : (
                                <p className="text-3xl font-bold">Rs {balanceWallet.toLocaleString()}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-light text-white/90">Recharge wallet</p>
                            {isLoading ? (
                                 <Skeleton className="h-8 w-32 mx-auto mt-1 bg-white/20" />
                            ) : (
                                <p className="text-3xl font-bold">Rs {rechargeWallet.toLocaleString()}</p>
                            )}
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden">
                        <div className="absolute bottom-[-50px] left-[-10%] right-[-10%] h-[100px] rounded-t-[50%] bg-background/20 backdrop-blur-sm"></div>
                    </div>
                </div>
                <div className="bg-background/20 backdrop-blur-sm p-6 pt-12">
                    <div className="grid grid-cols-3 gap-4">
                        <StatItem isLoading={isLoading} label="Total income" value={totalIncome.toLocaleString()} />
                        <StatItem isLoading={isLoading} label="Total recharge" value={totalRecharge.toLocaleString()} />
                        <StatItem isLoading={isLoading} label="Total assets" value={totalAssets.toLocaleString()} />
                        <StatItem isLoading={isLoading} label="Total withdraw" value={totalWithdraw.toLocaleString()} />
                        <StatItem isLoading={isLoading} label="Today's income" value={todaysIncome.toLocaleString()} />
                        <StatItem isLoading={isLoading} label="Team income" value={teamIncome.toLocaleString()} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
