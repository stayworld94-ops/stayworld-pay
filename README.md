# StayWorld — NOWPayments Embed Kit (Card + Crypto)

이 키트는 **기존 StayWorld 사이트** 어디든 버튼만 달면
NOWPayments(카드+코인) 결제로 바로 리다이렉트되는 **임베드 스크립트**입니다.

---

## 1) 배포 (한 번만)
- 아래 두 파일(서버리스 함수)을 **Netlify**에 배포하세요 (사이트 루트 기준)
```
netlify/functions/createNowInvoice.js
netlify/functions/verifyNowInvoice.js
netlify.toml
package.json
```
- Netlify 환경변수 설정
  - `NOWPAYMENTS_API_KEY`
  - `SITE_BASE_URL` (예: https://stayworldbooking.com)
  - (선택) `NOWPAYMENTS_PAY_CURRENCY` (예: USDTTRC20)

> 이미 Functions가 배포되어 있다면, 이 단계는 건너뛰세요.

---

## 2) 프런트 임베드 (모든 페이지 어디든)
HTML에 스크립트와(선택) 스타일 추가:
```html
<link rel="stylesheet" href="/embed/nowpayments-embed.css">
<script src="/embed/nowpayments-embed.js" defer></script>
```

**예약 버튼**에 데이터 속성만 달면 자동 인식합니다:
```html
<button class="sw-pay-now"
  data-listing-id="IST001"
  data-listing-name="Istanbul Golden Horn View"
  data-price="264.00"              <!-- 총액 -->
  data-currency="USD"
  data-cin="2025-09-02"
  data-cout="2025-09-05"
  data-guests="2">
  결제하기
</button>
```

여러 곳에 버튼을 여러 개 달아도 됩니다.

---

## 3) (선택) 자바스크립트로 직접 호출
직접 컨트롤 하고 싶다면 JS에서 호출하세요:
```html
<script>
  // 페이지 준비 후
  window.StayWorldPay.createInvoice({
    priceAmount: 264.00,
    priceCurrency: 'USD',
    orderDescription: 'Istanbul Golden Horn View — 3 nights, 2 guests',
    bookingId: 'BK-' + Math.random().toString(36).slice(2,8).toUpperCase() // 직접 지정 가능
  }).then(url => {
    location.href = url; // 호스티드 결제 페이지로 이동
  }).catch(err => alert(err.message || err));
</script>
```

---

## 작동 방식
- `nowpayments-embed.js`가 `.sw-pay-now` 버튼을 찾아 클릭 이벤트를 연결합니다.
- 클릭 시 `/.netlify/functions/createNowInvoice`에 요청 → **invoice_url**을 받아 **NOWPayments 호스티드 페이지**로 리다이렉트합니다.
- 결제가 끝나면 NOWPayments가 `SITE_BASE_URL/public/confirmation.html`로 돌아오도록 설정되어 있습니다(필요 시 함수 코드에서 경로 수정).

---

## 파일 설명
```
embed/
  nowpayments-embed.js   # 예약 버튼 자동 감지 + 인보이스 생성
  nowpayments-embed.css  # (선택) 버튼 강조 스타일

netlify/functions/
  createNowInvoice.js    # NOWPayments Invoice 생성
  verifyNowInvoice.js    # 결제 결과 조회 (확인 페이지에서 사용)

netlify.toml
package.json
```

---

## 흔한 Q&A
- **카드결제는 어디서 가능한가요?**
  - NOWPayments **호스티드 인보이스 페이지**에서 계정/지역 설정에 따라 카드 옵션이 자동 노출됩니다.
- **통화는 어떻게 바꾸나요?**
  - 버튼의 `data-currency`값 혹은 JS 호출 시 `priceCurrency` 값으로 지정합니다(기본 USD).
- **포인트 적립/알림 연동은?**
  - `public/confirmation.html`에서 `verifyNowInvoice` 호출 결과가 `ok:true`일 때 포인트 적립, 알림 발송 등 후처리를 실행하세요.
