import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Setup() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const setupUser = async () => {
            try {
                setLoading(true);

                // Call API to setup user
                const response = await fetch('/api/auth/setup-user', {
                    method: 'POST',
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to setup account');
                }

                router.push('/');

            } catch (err) {
                console.error('Setup error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        setupUser();
    }, [router]);

    // ... rest of the component remains the same
}