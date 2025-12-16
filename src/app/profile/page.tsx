'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold">Please log in</h2>
            <p className="text-muted-foreground">You need to be logged in to view your profile.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline">My Profile</h1>
        <p className="text-muted-foreground">View and manage your account details.</p>
      </header>

      <Card>
        <CardHeader className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? ''} />
                <AvatarFallback className="text-3xl">{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{user.displayName}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" defaultValue={user.displayName ?? ''} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={user.email ?? ''} readOnly />
            </div>
             <div className="space-y-2">
                <Label htmlFor="uid">User ID</Label>
                <Input id="uid" defaultValue={user.uid} readOnly />
            </div>
            <Button className="w-full">Update Profile</Button>
        </CardContent>
      </Card>
    </div>
  );
}
