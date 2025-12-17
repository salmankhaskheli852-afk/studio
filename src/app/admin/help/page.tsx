
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus2, MessageSquare, LifeBuoy } from 'lucide-react';
import { useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import type { AppSettings } from '@/lib/data';
import Link from 'next/link';

export default function HelpPage() {
    const firestore = useFirestore();

    const appSettingsDocRef = useMemoFirebase(
        () => firestore ? doc(firestore, 'app_settings', 'global') : null,
        [firestore]
    );
    const { data: appSettings, isLoading: areSettingsLoading } = useDoc<AppSettings>(appSettingsDocRef);

    const whatsappLink = appSettings?.customerCareWhatsapp
        ? `https://wa.me/${appSettings.customerCareWhatsapp.replace(/[^0-9]/g, '')}`
        : '#';

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Help & Support</h1>
                <p className="text-muted-foreground">Get in touch for personal plans or customer support.</p>
            </header>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="flex flex-col items-center justify-center text-center p-6">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                           <FilePlus2 className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="mt-4">Add Your Personal Plan</CardTitle>
                        <CardDescription>
                            Looking for a customized investment plan? Get in touch with us to discuss your needs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg" disabled={!appSettings?.customerCareWhatsapp || areSettingsLoading}>
                           <Link href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                <MessageSquare className="mr-2 h-5 w-5" />
                                Contact Us
                           </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="flex flex-col items-center justify-center text-center p-6">
                    <CardHeader>
                         <div className="mx-auto bg-accent/10 p-4 rounded-full w-fit">
                           <LifeBuoy className="h-10 w-10 text-accent" />
                        </div>
                        <CardTitle className="mt-4">Customer Care</CardTitle>
                        <CardDescription>
                            Have a question or need assistance with your account? Our support team is here to help.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button asChild size="lg" variant="secondary" disabled={!appSettings?.customerCareWhatsapp || areSettingsLoading}>
                           <Link href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                <MessageSquare className="mr-2 h-5 w-5" />
                                Contact on WhatsApp
                           </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

