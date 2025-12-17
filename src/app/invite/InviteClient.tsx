"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Check, User } from "lucide-react";
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import type { AppSettings } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

type AppUser = {
  id: string;
  displayName: string;
  email: string;
  referralCode?: string;
  referrals?: { userId: string; date: any }[];
};


export function InviteClient() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserLoading } = useDoc<AppUser>(userDocRef);

  const appSettingsDocRef = useMemoFirebase(
      () => firestore ? doc(firestore, 'app_settings', 'global') : null,
      [firestore]
  );
  const { data: appSettings, isLoading: areSettingsLoading } = useDoc<AppSettings>(appSettingsDocRef);

  const referralCode = userData?.referralCode;
  const baseUrl = appSettings?.websiteUrl || 'https://investpro.app';
  const invitationLink = referralCode ? `${baseUrl}/register?ref=${referralCode}` : '';

  const copyToClipboard = () => {
    if (!invitationLink) return;
    navigator.clipboard.writeText(invitationLink).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Invitation link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isLoading = isUserLoading || areSettingsLoading;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Invite & Earn</h1>
        <p className="text-muted-foreground">Share your link with friends and earn rewards.</p>
      </header>
      
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Your Invitation Link</CardTitle>
              <CardDescription>Share this link to invite others and get bonuses on their investments.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex w-full max-w-lg items-center space-x-2">
              <Skeleton className="h-10 flex-grow" />
              <Skeleton className="h-10 w-10" />
            </div>
          ) : (
            <div className="flex w-full max-w-lg items-center space-x-2">
              <Input type="text" value={invitationLink} readOnly />
              <Button type="button" size="icon" onClick={copyToClipboard} disabled={!invitationLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
            <CardDescription>Track the friends who have joined using your link. Total referrals: {userData?.referrals?.length ?? 0}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : userData?.referrals && userData.referrals.length > 0 ? (
            <div className="space-y-4">
              {userData.referrals.map((ref, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="font-mono text-sm">{ref.userId}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {ref.date && ref.date.seconds ? new Date(ref.date.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">You haven't referred anyone yet.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
