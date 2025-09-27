'use server'

// Query our Clerk metadata-backed API to determine premium status
const checkPro = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/has-premium`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });
        if (!res.ok) return false;
        const data = await res.json();
        return Boolean(data?.isPremium);
    } catch (e) {
        console.error('Error checking premium status:', e);
        return false;
    }
}

export default checkPro;