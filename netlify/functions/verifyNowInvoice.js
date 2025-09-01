// Node 18+ 내장 fetch 사용

export async function handler(event) {
  try {
    const params = event.queryStringParameters || {};
    const invoice_id = params.invoice_id;
    if (!invoice_id) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'invoice_id missing' }) };
    }

    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'NOWPAYMENTS_API_KEY missing' }) };
    }

    const resp = await fetch(`https://api.nowpayments.io/v1/invoice/${invoice_id}`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey }
    });
    const data = await resp.json();

    const status = (data && data.status) || '';
    const ok = status === 'finished';
    const pending = (status === 'waiting' || status === 'partially_paid' || status === 'confirming');

    return { statusCode: 200, body: JSON.stringify({ ok, pending, raw: data }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(e) }) };
  }
}
