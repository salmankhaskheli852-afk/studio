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
import { doc, setDoc, getDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { Landmark } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

const ADMIN_EMAIL = 'salmankhaskheli885@gmail.com';
const STARTING_USER_ID = 100100;

export function LoginClient() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      if (user.email === ADMIN_EMAIL) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, isUserLoading, router]);

  const getNextCustomId = async () => {
    if (!firestore) return STARTING_USER_ID.toString();
    
    // Firestore's orderBy on a string field might not sort numerically as expected (e.g., "10" comes before "2").
    // Fetch all users, convert customId to a number, and find the max.
    // This is less efficient for very large user bases but reliable for your ID format.
    const usersRef = collection(firestore, 'users');
    const querySnapshot = await getDocs(usersRef);

    if (querySnapshot.empty) {
      return STARTING_USER_ID;
    }

    let maxId = 0;
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if(userData.customId) {
        const numericId = parseInt(userData.customId, 10);
        if (numericId > maxId) {
          maxId = numericId;
        }
      }
    });
    
    // If no users have a valid customId yet, start from the beginning.
    if(maxId < STARTING_USER_ID) {
        return STARTING_USER_ID;
    }

    return maxId + 1;
  };

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

      const nextId = await getNextCustomId();

      await setDoc(userDocRef, {
        id: firebaseUser.uid,
        customId: nextId.toString(),
        googleId: firebaseUser.providerData
          .find((p) => p.providerId === 'google.com')
          ?.uid.toString(),
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        referralCode: referralCode,
        investments: [],
        referrals: [],
        isAdmin: firebaseUser.email === ADMIN_EMAIL,
        createdAt: serverTimestamp(),
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
            <Landmark className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">
            Welcome to InvestPro
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
