export async function fetchMarketAnalysis() {
  const token = localStorage.getItem('token');

  const res = await fetch('https://localhost:5001/api/MarketAnalysis', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error(`Status: ${res.status} - ${res.statusText}`);
    throw new Error('Failed to fetch market analysis');
  }

  return res.json();
}
