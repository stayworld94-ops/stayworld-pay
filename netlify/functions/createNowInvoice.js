// fetch는 Node 18 이상에서 내장되어 있으므로 node-fetch 불필요

export async function handler(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, error: 'NOWPAYMENTS_API_KEY missing' })
      };
    }

    const site = process.env.SITE_BASE_URL || '';
    const pay_currency = process.env.NOWPAYMENTS_PAY_CURRENCY || undefined;

    const payload = {
      price_amount: Number(body.price_amount || 0),
      price_currency: body.price_currency || 'USD',
      order_id: body.bookingId || 'BK',
      order_description: body.order_description || 'StayWorld Booking',
      success_url: `${site}/stayworld_nowpayments_single.html?provider=nowpayments&bookingId=${encodeURIComponent(body.bookingId || '')}`,
      cancel_url: `${site}/stayworld_nowpayments_single.html?provider=nowpayments&bookingId=${encodeURIComponent(body.bookingId || '')}`
    };
    if (pay_currency) {
      payload.pay_currency = pay_currency;
    }

    const resp = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (data && data.invoice_url) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, invoice_url: data.invoice_url, invoice_id: data.id })
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: data })
      };
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: String(e) })
    };
  }
}
