export async function callPerplexityAPI(prompt: string) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not defined in environment variables');
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pplx-7b-online', // lub inny model, który używasz
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API responded with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw error;
  }
}