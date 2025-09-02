const { db, admin } = require("./_firebaseAdmin");

// ⚠️ 실 배포 시에는 PayPal 웹훅 서명 검증 반드시 추가해야 함

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200 };
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  try {
    const body = JSON.parse(event.body || "{}");
    const eventType = body.event_type;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = body.resource || {};
      const customId = resource.supplementary_data?.related_ids?.order_id || resource.invoice_id || resource.custom_id;
      const paymentRef = resource.id;
      const bookingId = customId;

      if (!bookingId) return { statusCode: 200, body: "no-op" };

      const ref = db.collection("bookings").doc(bookingId);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return;
        const data = snap.data();
        if (["confirmed","paid"].includes(data.status)) return;

        tx.update(ref, {
          status: "confirmed",
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          gateway: "paypal",
          paymentRef,
        });
        tx.update(db.collection("holds").doc(bookingId), { active: false, releasedAt: admin.firestore.FieldValue.serverTimestamp() });
      });
    }

    return { statusCode: 200, body: "ok" };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: "Server Error" };
  }
};
