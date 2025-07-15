import React, { useEffect, useState } from 'react';
import { fetchAccountInfo } from '../../services/fetchAccountInfo';

export default function AccountInfo() {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAccountInfo();
        setAccount(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <p className="p-4">Loading account...</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;
  if (!account) return <p className="p-4 text-gray-500">No account data.</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Account</h2>
      <p><strong>Name:</strong> {account.name}</p>
      <p><strong>Plan:</strong> {account.plan || '—'}</p>
    </div>
  );
}
