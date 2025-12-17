
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Lock, Fingerprint } from 'lucide-react';

export default function SecurityPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Security</h1>
                <p className="text-muted-foreground">Your trust and security are our top priority.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Our Commitment to Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                        <ShieldCheck className="h-8 w-8 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Verified by All Major Banks</h3>
                            <p className="text-muted-foreground">
                                Our platform is integrated and verified with all major banks in Pakistan, ensuring that your transactions are secure and compliant with local regulations.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Lock className="h-8 w-8 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Data Encryption</h3>
                            <p className="text-muted-foreground">
                                All your personal information and transaction data are encrypted both in transit and at rest. We use industry-standard encryption protocols to protect your data from unauthorized access.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Fingerprint className="h-8 w-8 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Secure Authentication</h3>
                            <p className="text-muted-foreground">
                                We use secure and trusted authentication providers like Google to manage access to your account. This ensures that only you can access your wallet and investment details.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
