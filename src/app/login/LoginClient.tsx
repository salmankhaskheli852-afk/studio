'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { Crown } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

export function LoginClient() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect logic is now mainly handled by AppLayout based on roles
    if (!isUserLoading && user) {
        // Simple redirect to home, AppLayout will handle admin routing
        router.push('/');
    }
  }, [user, isUserLoading, router]);

  const createUserDocuments = async (firebaseUser: FirebaseUser) => {
    if (!firestore) return;

    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    // Create user and wallet docs only if user is new
    if (!userDoc.exists()) {
      const walletDocRef = doc(
        firestore,
        `users/${firebaseUser.uid}/wallet`,
        firebaseUser.uid
      );
      const referralCode =
        Math.random().toString(36).substring(2, 8).toUpperCase() +
        Math.random().toString(36).substring(2, 8).toUpperCase();

      // New users get the 'user' role by default
      const userRole = 'user';

      await setDoc(userDocRef, {
        id: firebaseUser.uid,
        googleId: firebaseUser.providerData
          .find((p) => p.providerId === 'google.com')
          ?.uid.toString(),
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        referralCode: referralCode,
        investments: [],
        referrals: [],
        role: userRole,
        createdAt: serverTimestamp(),
      });

      // Set the custom claim for the new user
      // Note: This requires an admin-privileged backend, which we do via a callable function or server action.
      // For simplicity in this context, we assume the claim is set.
      // In a real app, you'd trigger a server function here.

      await setDoc(walletDocRef, {
        id: firebaseUser.uid,
        userId: firebaseUser.uid,
        balance: 0,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    if (auth && firestore) {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const signedInUser = result.user;

        await createUserDocuments(signedInUser);

        // Redirect is handled by the useEffect hook
        router.push('/');

      } catch (error: any) {
        // Don't log an error if the user cancels the popup
        if (error.code === 'auth/cancelled-popup-request') {
          return;
        }
        console.error('Error signing in with Google', error);
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
            <Crown className="h-10 w-10 text-amber-500" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">
            InvestPro
          </CardTitle>
          <CardDescription>
            Sign in to access your wallet and investments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    