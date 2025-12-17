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
    () =&gt; (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserLoading } = useDoc&lt;AppUser&gt;(userDocRef);

  const appSettingsDocRef = useMemoFirebase(
      () =&gt; firestore ? doc(firestore, 'app_settings', 'global') : null,
      [firestore]
  );
  const { data: appSettings, isLoading: areSettingsLoading } = useDoc&lt;AppSettings&gt;(appSettingsDocRef);

  const referralCode = userData?.referralCode;
  const baseUrl = appSettings?.websiteUrl || 'https://investpro.app';
  const invitationLink = referralCode ? `${baseUrl}/register?ref=${referralCode}` : '';

  const copyToClipboard = () =&gt; {
    if (!invitationLink) return;
    navigator.clipboard.writeText(invitationLink).then(() =&gt; {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Invitation link copied to clipboard.",
      });
      setTimeout(() =&gt; setCopied(false), 2000);
    });
  };

  const isLoading = isUserLoading || areSettingsLoading;

  return (
    &lt;div className="space-y-6"&gt;
      &lt;header&gt;
        &lt;h1 className="text-3xl font-bold tracking-tight font-headline"&gt;Invite &amp; Earn&lt;/h1&gt;
        &lt;p className="text-muted-foreground"&gt;Share your link with friends and earn rewards.&lt;/p&gt;
      &lt;/header&gt;
      
      &lt;Card&gt;
        &lt;CardHeader&gt;
          &lt;div className="flex items-start gap-4"&gt;
            &lt;div className="bg-primary/10 p-3 rounded-full"&gt;
              &lt;Gift className="h-6 w-6 text-primary" /&gt;
            &lt;/div&gt;
            &lt;div&gt;
              &lt;CardTitle&gt;Your Invitation Link&lt;/CardTitle&gt;
              &lt;CardDescription&gt;Share this link to invite others and get bonuses on their investments.&lt;/CardDescription&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/CardHeader&gt;
        &lt;CardContent&gt;
          {isLoading ? (
            &lt;div className="flex w-full max-w-lg items-center space-x-2"&gt;
              &lt;Skeleton className="h-10 flex-grow" /&gt;
              &lt;Skeleton className="h-10 w-10" /&gt;
            &lt;/div&gt;
          ) : (
            &lt;div className="flex w-full max-w-lg items-center space-x-2"&gt;
              &lt;Input type="text" value={invitationLink} readOnly /&gt;
              &lt;Button type="button" size="icon" onClick={copyToClipboard} disabled={!invitationLink}&gt;
                {copied ? &lt;Check className="h-4 w-4" /&gt; : &lt;Copy className="h-4 w-4" /&gt;}
              &lt;/Button&gt;
            &lt;/div&gt;
          )}
        &lt;/CardContent&gt;
      &lt;/Card&gt;
      
      &lt;Card&gt;
        &lt;CardHeader&gt;
            &lt;CardTitle&gt;Your Referrals&lt;/CardTitle&gt;
            &lt;CardDescription&gt;Track the friends who have joined using your link. Total referrals: {userData?.referrals?.length ?? 0}&lt;/CardDescription&gt;
        &lt;/CardHeader&gt;
        &lt;CardContent&gt;
          {isLoading ? (
            &lt;Skeleton className="h-24 w-full" /&gt;
          ) : userData?.referrals &amp;&amp; userData.referrals.length &gt; 0 ? (
            &lt;div className="space-y-4"&gt;
              {userData.referrals.map((ref, index) =&gt; (
                &lt;div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"&gt;
                  &lt;div className="flex items-center gap-3"&gt;
                    &lt;User className="h-5 w-5 text-muted-foreground" /&gt;
                    &lt;span className="font-mono text-sm"&gt;{ref.userId}&lt;/span&gt;
                  &lt;/div&gt;
                  &lt;span className="text-sm text-muted-foreground"&gt;
                    {ref.date &amp;&amp; ref.date.seconds ? new Date(ref.date.seconds * 1000).toLocaleDateString() : 'N/A'}
                  &lt;/span&gt;
                &lt;/div&gt;
              ))}
            &lt;/div&gt;
          ) : (
            &lt;p className="text-center text-muted-foreground py-8"&gt;You haven't referred anyone yet.&lt;/p&gt;
          )}
        &lt;/CardContent&gt;
      &lt;/Card&gt;

    &lt;/div&gt;
  );
}
