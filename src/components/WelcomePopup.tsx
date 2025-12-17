
'use client';

import { useState, useEffect } from 'react';
import { useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import type { AppSettings } from '@/lib/data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, MessageSquare } from 'lucide-react';

const SESSION_STORAGE_KEY = 'welcomePopupShown';

export function WelcomePopup() {
    const [showWelcome, setShowWelcome] = useState(false);
    const [showAdminMessage, setShowAdminMessage] = useState(false);

    const firestore = useFirestore();
    const appSettingsDocRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'app_settings', 'global') : null),
        [firestore]
    );
    const { data: appSettings } = useDoc<AppSettings>(appSettingsDocRef);

    useEffect(() => {
        const hasBeenShown = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!hasBeenShown) {
            // Show initial welcome popup immediately
            setShowWelcome(true);
            sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        }
    }, []);

    const handleWelcomeClose = () => {
        setShowWelcome(false);

        // Set a timer to show the admin message after 30 seconds
        if (appSettings?.welcomePopupMessage) {
            setTimeout(() => {
                setShowAdminMessage(true);
            }, 30000); // 30 seconds
        }
    };
    
    return (
        <>
            {/* Initial Welcome Popup */}
            <Dialog open={showWelcome} onOpenChange={(isOpen) => !isOpen && handleWelcomeClose()}>
                <DialogContent>
                    <DialogHeader className="items-center text-center">
                        <div className="p-4 bg-primary/10 rounded-full w-fit mb-4">
                           <PartyPopper className="h-10 w-10 text-primary" />
                        </div>
                        <DialogTitle className="text-2xl font-bold">Welcome to InvestPro!</DialogTitle>
                        <DialogDescription>We're glad to have you on board. Start your investment journey with us.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="justify-center pt-4">
                        <Button onClick={handleWelcomeClose} size="lg">Get Started</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Admin-defined Popup */}
            <Dialog open={showAdminMessage} onOpenChange={setShowAdminMessage}>
                <DialogContent>
                     <DialogHeader className="items-center text-center">
                        {appSettings?.welcomePopupTitle && (
                             <div className="p-4 bg-accent/10 rounded-full w-fit mb-4">
                                <MessageSquare className="h-10 w-10 text-accent" />
                             </div>
                        )}
                        <DialogTitle className="text-2xl font-bold">{appSettings?.welcomePopupTitle || 'A Message from Us'}</DialogTitle>
                        <DialogDescription>
                           {appSettings?.welcomePopupMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="justify-center pt-4">
                        <Button onClick={() => setShowAdminMessage(false)} variant="secondary" size="lg">Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
