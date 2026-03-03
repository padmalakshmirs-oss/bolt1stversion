export async function generateRecommendations(userId: string) {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-recommendations`;

  const headers = {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) throw new Error('Failed to generate recommendations');

  const data = await response.json();
  return data.recommendations || [];
}

export async function seedDatabase() {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-database`;

  const headers = {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
  });

  if (!response.ok) throw new Error('Failed to seed database');

  return response.json();
}
