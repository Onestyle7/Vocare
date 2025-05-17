import { NextRequest, NextResponse } from 'next/server';
import { callPerplexityAPI } from '@/lib/server/perplexity';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const result = await callPerplexityAPI(prompt);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in Perplexity API route:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}