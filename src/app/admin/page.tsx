'use client';
import { AdminClient } from "./AdminClient";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ADMIN_EMAIL = "admin@example.com"; // IMPORTANT: Replace with your actual admin email

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.email !== ADMIN_EMAIL) {
        router.push('/');
      }
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || user.email !== ADMIN_EMAIL) {
    return <div>Loading or redirecting...</div>;
  }

  return <AdminClient />;
}
