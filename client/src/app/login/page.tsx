'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) router.replace('/dashboard');
    }, [user, loading, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
    }

    return (
        <div className="auth-container">
            <div className="auth-card card">
                <div className="auth-header">
                    <h1>TaskFlow</h1>
                    <p>Welcome back! Sign in to your account.</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading} style={{ width: '100%' }}>
                        {isLoading ? <><div className="spinner" /> Signing in...</> : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    Don&apos;t have an account? <Link href="/register">Create one</Link>
                </div>
            </div>
        </div>
    );
}
