(function(){
  const API_PATH = '/.netlify/functions/createNowInvoice';

  function uid(){
    return 'BK-' + Math.random().toString(36).slice(2,8).toUpperCase();
  }

  async function createInvoice({ priceAmount, priceCurrency='USD', orderDescription='StayWorld Booking', bookingId }){
    const payload = {
      bookingId: bookingId || uid(),
      price_amount: Number(priceAmount),
      price_currency: priceCurrency,
      order_description: orderDescription
    };
    const res = await fetch(API_PATH, {
      method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(!res.ok || !data.invoice_url){
      throw new Error((data && (data.error && (data.error.message || data.error.error_description))) || 'NOWPayments error');
    }
    return data.invoice_url;
  }

  function bindButtons(){
    const btns = document.querySelectorAll('.sw-pay-now');
    btns.forEach(btn => {
      if(btn.__swBound) return; // avoid double binding
      btn.__swBound = true;
      btn.addEventListener('click', async () => {
        try{
          const name = btn.dataset.listingName || 'StayWorld Booking';
          const cin = btn.dataset.cin || '';
          const cout = btn.dataset.cout || '';
          const guests = btn.dataset.guests || '';
          const nights = (cin && cout) ? Math.max(1, Math.ceil((new Date(cout)-new Date(cin))/(1000*60*60*24))) : '';
          const desc = [name, nights?`${nights} nights`:null, guests?`${guests} guests`:null].filter(Boolean).join(' — ');

          const url = await createInvoice({
            priceAmount: btn.dataset.price || '0',
            priceCurrency: btn.dataset.currency || 'USD',
            orderDescription: desc,
            bookingId: btn.dataset.bookingId || undefined
          });
          location.href = url;
        }catch(e){
          console.error(e);
          alert(e.message || 'Payment error');
        }
      });
    });
  }

  // expose API
  window.StayWorldPay = { createInvoice, bindButtons };

  // auto-bind on DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindButtons);
  }else{
    bindButtons();
  }
})();