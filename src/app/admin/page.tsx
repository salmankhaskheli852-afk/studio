'use client';
import { AdminClient } from "./AdminClient";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push('/login');
      } 
      // This check is now handled by AppLayout based on custom claims
      // else if (user.email !== ADMIN_EMAIL) {
      //   router.push('/');
      // }
    }
  }, [user, isUserLoading, router]);

  // Check for admin role is now implicitly handled by the layout,
  // which will redirect non-admins. We can show a loading spinner
  // until the redirect happens or the component loads.
  if (isUserLoading || !user) {
    return <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>;
  }

  return <AdminClient />;
}
