'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import type { AppSettings } from '@/lib/data';
import { Megaphone } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export function AdvertisementCard() {
    const firestore = useFirestore();

    const appSettingsDocRef = useMemoFirebase(
        () => firestore ? doc(firestore, 'app_settings', 'global') : null,
        [firestore]
    );
    const { data: appSettings, isLoading: areSettingsLoading } = useDoc<AppSettings>(appSettingsDocRef);

    const whatsappLink = appSettings?.customerCareWhatsapp
        ? `https://wa.me/${appSettings.customerCareWhatsapp.replace(/[^0-9]/g, '')}`
        : null;

    if (areSettingsLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        )
    }

    if (!whatsappLink) {
        return null;
    }

    return (
        <Card className="bg-accent/20 border-accent">
            <CardHeader className="flex-row items-center gap-4">
                <div className="bg-accent/20 p-3 rounded-full">
                    <Megaphone className="h-6 w-6 text-accent" />
                </div>
                <div>
                    <CardTitle className="text-accent">Advertise Your Business</CardTitle>
                    <CardDescription className="text-foreground/80">
                        Want to reach a wider audience? Place your ad here and grow your business with us.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                    <Link href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        Contact Us
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
