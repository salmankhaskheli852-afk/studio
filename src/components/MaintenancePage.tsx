'use client';

import { Wrench } from 'lucide-react';

interface MaintenancePageProps {
    message?: string;
}

export function MaintenancePage({ message }: MaintenancePageProps) {
    const defaultMessage = "The application is currently under maintenance. We are working to improve your experience. Your funds are safe. Please check back later.";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <Wrench className="h-24 w-24 text-primary animate-bounce" />
            <h1 className="mt-8 text-4xl font-bold tracking-tight font-headline text-foreground">
                Under Maintenance
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                {message || defaultMessage}
            </p>
        </div>
    );
}
