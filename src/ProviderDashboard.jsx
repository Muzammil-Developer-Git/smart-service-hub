
import { useEffect, useState } from "react";
import { Query } from "appwrite";
import { account, tablesDB, DATABASE_ID } from "./appwrite";
import "./ProviderDashboard.css";

function ProviderDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  async function loadBookings() {
    try {
      setLoading(true);
      setMessage("");

      const user = await account.get();

      // Verify that the logged-in user is an approved provider.
      const providerResponse = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: "service_providers",
        queries: [
          Query.equal("userId", user.$id),
          Query.equal("status", "Approved"),
        ],
      });

      if (providerResponse.rows.length === 0) {
        setBookings([]);
        setMessage("Access denied. You are not an approved service provider.");
        return;
      }

      // Load bookings assigned to this provider.
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: "bookings",
        queries: [
          Query.equal("providerUserId", user.$id),
          Query.orderDesc("$createdAt"),
        ],
      });

      setBookings(response.rows);
    } catch (error) {
      console.error("Provider Dashboard Error:", error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function updateBookingStatus(bookingId, newStatus) {
    try {
      setUpdatingId(bookingId);
      setMessage("");

      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: "bookings",
        rowId: bookingId,
        data: {
          status: newStatus,
        },
      });

      setMessage(`Booking ${newStatus} successfully!`);
      await loadBookings();
    } catch (error) {
      console.error("Booking Update Error:", error);
      setMessage("Update failed: " + error.message);
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className="provider-dashboard">
      <h2>Provider Dashboard</h2>
      <p>Manage your customer booking requests.</p>

      <div className="dashboard-heading">
        <h3>My Bookings ({bookings.length})</h3>

        <button
          className="refresh-bookings"
          onClick={loadBookings}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {message && <p className="provider-message">{message}</p>}

      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p>No booking requests found.</p>
      ) : (
        <div className="provider-booking-list">
          {bookings.map((booking) => (
            <div className="provider-booking-card" key={booking.$id}>
              <h3>{booking.serviceCategory}</h3>

              <p><strong>Customer:</strong> {booking.customerName}</p>
              <p><strong>Phone:</strong> {booking.customerPhone}</p>
              <p><strong>Address:</strong> {booking.serviceAddress}</p>
              <p><strong>Date:</strong> {booking.preferredDate}</p>

              <p>
                <strong>Status:</strong>{" "}
                <span className={`booking-status ${booking.status.toLowerCase()}`}>
                  {booking.status}
                </span>
              </p>

              {booking.status === "Pending" && (
                <div className="provider-booking-actions">
                  <button
                    disabled={updatingId === booking.$id}
                    onClick={() =>
                      updateBookingStatus(booking.$id, "Accepted")
                    }
                  >
                    {updatingId === booking.$id ? "Updating..." : "Accept"}
                  </button>

                  <button
                    disabled={updatingId === booking.$id}
                    onClick={() =>
                      updateBookingStatus(booking.$id, "Rejected")
                    }
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProviderDashboard;
