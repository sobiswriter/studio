
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, UserPlus, Chrome } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signup, loginWithGoogle, user, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/'); // Redirect to homepage if already logged in
    }
  }, [user, authLoading, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match. Please try again.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await signup(email, password);
      router.push('/'); // Redirect on successful signup
    } catch (err: any) {
      setError(err.message || 'Failed to create an account. Please try again.');
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.push('/'); // Redirect on successful Google sign-in
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google. Please try again.');
      console.error("Google Sign-up error:", err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background font-pixel p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background font-pixel p-4">
      <Card className="w-full max-w-md pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-pixel text-primary">Create your Pixel Due Account</CardTitle>
          <CardDescription className="font-pixel text-muted-foreground">Join the quest to conquer your tasks!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-destructive bg-destructive/20 p-3 rounded-md pixel-corners border border-destructive text-sm">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="font-pixel block mb-1">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="font-pixel input-pixel"
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <div>
              <Label htmlFor="password" className="font-pixel block mb-1">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                required
                minLength={6}
                className="font-pixel input-pixel"
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="font-pixel block mb-1">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className="font-pixel input-pixel"
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <Button type="submit" className="w-full font-pixel btn-pixel" disabled={isLoading || isGoogleLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus size={18} />}
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-pixel">Or sign up with</span>
            </div>
          </div>
           <Button 
            variant="outline" 
            className="w-full font-pixel btn-pixel" 
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome size={18} />}
            {isGoogleLoading ? 'Processing...' : 'Sign up with Google'}
          </Button>
        </CardContent>
        <CardFooter className="text-center block">
          <p className="text-sm text-muted-foreground font-pixel">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
