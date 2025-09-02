const { db, admin } = require("./_firebaseAdmin");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200 };
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  try {
    const body = JSON.parse(event.body || "{}");
    const { payment_status, order_id, payment_id } = body;

    const done = ["finished","confirmed"].includes((payment_status || "").toLowerCase());
    if (!done) return { statusCode: 200, body: "ignored" };

    const bookingId = order_id;
    const ref = db.collection("bookings").doc(bookingId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return;
      const data = snap.data();
      if (data.status === "confirmed" || data.status === "paid") return;

      tx.update(ref, {
        status: "confirmed",
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        gateway: "nowpayments",
        paymentRef: payment_id,
      });
      tx.update(db.collection("holds").doc(bookingId), { active: false, releasedAt: admin.firestore.FieldValue.serverTimestamp() });
    });

    return { statusCode: 200, body: "ok" };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: "Server Error" };
  }
};
