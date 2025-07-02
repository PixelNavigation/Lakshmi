// Proxy for Yahoo Finance search to bypass CORS
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const quotesCount = searchParams.get('quotesCount') || 10;
  const newsCount = searchParams.get('newsCount') || 0;

  if (!q) {
    return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400 });
  }

  const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=${quotesCount}&newsCount=${newsCount}`;

  try {
    const yahooRes = await fetch(yahooUrl);
    const data = await yahooRes.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Yahoo proxy failed', details: err.message }), { status: 500 });
  }
}
