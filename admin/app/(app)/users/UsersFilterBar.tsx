'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function UsersFilterBar({ initialSearch, initialTier }: { initialSearch: string; initialTier: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [tier, setTier] = useState(initialTier);

  function apply(nextSearch: string, nextTier: string) {
    const query = new URLSearchParams();
    if (nextSearch) query.set('search', nextSearch);
    if (nextTier) query.set('tier', nextTier);
    router.push(`/users?${query.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <input
        type="search"
        placeholder="İsim veya e-posta ara…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') apply(search, tier);
        }}
        className="w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
      <select
        value={tier}
        onChange={(e) => {
          setTier(e.target.value);
          apply(search, e.target.value);
        }}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      >
        <option value="">Tüm Tier&apos;lar</option>
        <option value="FREE">Free</option>
        <option value="PREMIUM">Premium</option>
      </select>
      <button
        onClick={() => apply(search, tier)}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Ara
      </button>
    </div>
  );
}
