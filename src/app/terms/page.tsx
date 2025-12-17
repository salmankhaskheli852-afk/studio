
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Terms & Conditions</h1>
                <p className="text-muted-foreground">Please read our terms and conditions carefully.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>General Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                    <p>
                        Welcome to InvestPro Wallet. By using our application, you agree to be bound by these terms and conditions. If you do not agree with any part of these terms, you must not use our application.
                    </p>
                    <p>
                        You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Investments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                    <p>
                        The protection of your investment is our top priority. We give you a full guarantee that your money is safe and will not go anywhere. You can invest with complete confidence.
                    </p>
                    <p>
                        InvestPro Wallet provides investment plans with calculated returns. However, we do not guarantee any returns. All financial decisions made by you are your own, and you should seek independent financial advice if necessary.
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Deposits and Withdrawals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                    <p>
                       Deposits are subject to verification and may take time to reflect in your wallet. Withdrawals are processed based on the information you provide. Ensure your account details are correct, as we are not responsible for transactions sent to incorrect accounts.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
