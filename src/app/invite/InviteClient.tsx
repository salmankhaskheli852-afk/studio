"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Check } from "lucide-react";

export function InviteClient() {
  const referralCode = "REF123XYZ";
  const invitationLink = `https://investpro.app/register?ref=${referralCode}`;
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Invitation link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input type="text" value={invitationLink} readOnly />
            <Button type="button" size="icon" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
            <CardDescription>Track the friends who have joined using your link.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-center text-muted-foreground py-8">You haven't referred anyone yet.</p>
        </CardContent>
      </Card>

    </div>
  );
}
