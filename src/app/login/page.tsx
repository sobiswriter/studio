
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Changed to relative path
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, user, authLoading } = useAuth();
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full font-pixel btn-pixel" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn size={18} />}
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
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
