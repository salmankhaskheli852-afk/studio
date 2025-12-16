"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useUser } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Landmark } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

export function LoginClient() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (auth) {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
        router.push('/');
      } catch (error) {
        console.error("Error signing in with Google", error);
      }
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Landmark className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Welcome to InvestPro</CardTitle>
          <CardDescription>Sign in to access your wallet and investments.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            <FcGoogle className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
