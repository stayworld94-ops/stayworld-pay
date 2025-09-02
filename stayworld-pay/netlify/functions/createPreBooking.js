const { db, admin } = require("./_firebaseAdmin");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200 };
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const data = JSON.parse(event.body || "{}");
    const { listingId, userId, checkIn, checkOut, guests, currency, totalPrice, language } = data;
    if (!listingId || !userId || !checkIn || !checkOut || !totalPrice) {
      return { statusCode: 400, body: "Missing fields" };
    }

    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000));

    // 겹치는 홀드/확정 예약 있으면 차단
    const holdsSnap = await db.collection("holds")
      .where("listingId", "==", listingId)
      .where("checkIn", "==", checkIn)
      .where("checkOut", "==", checkOut)
      .where("active", "==", true)
      .get();

    const overlappingConfirmed = await db.collection("bookings")
      .where("listingId", "==", listingId)
      .where("checkIn", "==", checkIn)
      .where("checkOut", "==", checkOut)
      .where("status", "in", ["paid", "confirmed"])
      .get();

    if (!holdsSnap.empty || !overlappingConfirmed.empty) {
      return { statusCode: 409, body: JSON.stringify({ error: "DATE_UNAVAILABLE" }) };
    }

    const preRef = db.collection("bookings").doc();
    const holdRef = db.collection("holds").doc(preRef.id);

    await db.runTransaction(async (tx) => {
      tx.set(preRef, {
        listingId, userId, checkIn, checkOut, guests: guests || 1,
        currency: currency || "USD",
        totalPrice,
        language: language || "en",
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        gateway: null,
      });
      tx.set(holdRef, {
        bookingId: preRef.id,
        listingId, checkIn, checkOut,
        active: true,
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ bookingId: preRef.id, expiresAt: expiresAt.toDate().toISOString() })
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: "Server Error" };
  }
};
