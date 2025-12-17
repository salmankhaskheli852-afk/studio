
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

const ADMIN_EMAIL = "salmankhaskheli885@gmail.com";

export function LoginClient() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
        // Fetch the user document to check the role
        const checkUserRole = async () => {
            if (!firestore) return;
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && userDoc.data().role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/');
            }
        };

        if (user.email === ADMIN_EMAIL) {
            router.push('/admin');
        } else {
            checkUserRole();
        }
    }
  }, [user, isUserLoading, router, firestore]);

  const createUserDocuments = async (firebaseUser: FirebaseUser) => {
    if (!firestore) return;

    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const walletDocRef = doc(
        firestore,
        `users/${firebaseUser.uid}/wallet`,
        firebaseUser.uid
      );
      const referralCode =
        Math.random().toString(36).substring(2, 8).toUpperCase() +
        Math.random().toString(36).substring(2, 8).toUpperCase();

      // Default role is 'user'. The permanent admin email will be handled by security rules.
      const initialRole = firebaseUser.email === ADMIN_EMAIL ? 'admin' : 'user';

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
        createdAt: serverTimestamp(),
        role: initialRole, // Set role on creation
        disabled: false,
      });

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
        // This provides a quicker initial redirect for the main admin
        if (signedInUser.email === ADMIN_EMAIL) {
            router.push('/admin');
        } else {
            router.push('/');
        }

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
