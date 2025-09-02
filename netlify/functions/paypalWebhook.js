const { db, admin } = require("./_firebaseAdmin");

// ⚠️ 프로덕션에서는 PayPal 웹훅 서명 검증(Transmission-Id/Time, Cert URL, Signature, Body) 반드시 추가

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200 };
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  try {
    const body = JSON.parse(event.body || "{}");
    const eventType = body.event_type;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = body.resource || {};
      const customId = resource.supplementary_data?.related_ids?.order_id
        || resource.invoice_id
        || resource.custom_id;
      const paymentRef = resource.id;
      const bookingId = customId; // PayPal 주문 생성 시 custom_id=bookingId 로 보냈어야 함

      if (!bookingId) return { statusCode: 200, body: "no-op" };

      const ref = db.collection("bookings").doc(bookingId);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return;
        const data = snap.data();
        if (["confirmed", "paid"].includes(data.status)) return;

        tx.update(ref, {
          status: "confirmed",
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          gateway: "paypal",
          paymentRef,
        });
        tx.update(db.collection("holds").doc(bookingId), {
          active: false,
          releasedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    }

    return { statusCode: 200, body: "ok" };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: "Server Error" };
  }
};
