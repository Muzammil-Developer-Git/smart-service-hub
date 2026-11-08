
import { useEffect, useState } from "react";
import { Query } from "appwrite";
import { account, tablesDB, DATABASE_ID } from "./appwrite";
import "./CustomerBookingHistory.css";

function CustomerBookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBookings() {
    try {
      setLoading(true);
      setError("");

      const user = await account.get();

      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: "bookings",
        queries: [
          Query.equal("customerId", user.$id),
          Query.orderDesc("$createdAt"),
        ],
      });

      setBookings(response.rows);
    } catch (err) {
      console.error("Booking History Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <div className="booking-history">
      <div className="dashboard-heading">
        <div>
          <h2>My Booking History</h2>
          <p>View all your service booking requests.</p>
        </div>

        <button
          className="refresh-bookings"
          onClick={loadBookings}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <p>Loading your bookings...</p>
      ) : error ? (
        <p className="history-error">{error}</p>
      ) : bookings.length === 0 ? (
        <p>You have not made any bookings yet.</p>
      ) : (
        <div className="booking-history-list">
          {bookings.map((booking) => (
            <div className="history-card" key={booking.$id}>
              <h3>{booking.serviceCategory}</h3>

              <p><strong>Name:</strong> {booking.customerName}</p>
              <p><strong>Phone:</strong> {booking.customerPhone}</p>
              <p><strong>Address:</strong> {booking.serviceAddress}</p>
              <p><strong>Preferred Date:</strong> {booking.preferredDate}</p>

              <p>
                <strong>Status:</strong>{" "}
                <span className={`booking-status ${booking.status.toLowerCase()}`}>
                  {booking.status}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerBookingHistory;
