
"use client";

import { useState, useEffect } from 'react'; // Added useEffect
import { useAuth } from '../../contexts/AuthContext'; // Changed to relative path
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, LogIn, Chrome } from 'lucide-react'; // Added Chrome for Google icon

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login, loginWithGoogle, user, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/'); // Redirect to homepage if already logged in
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({email, password});
      router.push('/'); // Redirect on successful login
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
      console.error("Login error:", err);
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
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setError('Google Sign-In popup was blocked, cancelled, or closed. Please check your browser settings (disable popup blockers for this site) and try again.');
        console.error("Google Sign-in popup issue:", err);
      } else {
        setError(err.message || 'Failed to sign in with Google. Please try again.');
        console.error("Google Sign-in error:", err);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  if (authLoading || (!authLoading && user)) { // Show loading or redirect if user becomes available
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
          <CardTitle className="text-3xl font-pixel text-primary">Login to Pixel Due</CardTitle>
          <CardDescription className="font-pixel text-muted-foreground">Access your quests and level up!</CardDescription>
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
                placeholder="••••••••"
                required
                className="font-pixel input-pixel"
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <Button type="submit" className="w-full font-pixel btn-pixel" disabled={isLoading || isGoogleLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn size={18} />}
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-pixel">Or continue with</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full font-pixel btn-pixel" 
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome size={18} />}
            {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </CardContent>
        <CardFooter className="text-center block">
          <p className="text-sm text-muted-foreground font-pixel">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
