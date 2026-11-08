
import { useEffect, useState } from "react";
import { Query } from "appwrite";
import {
  account,
  tablesDB,
  teams,
  DATABASE_ID,
} from "./appwrite";

import "./AdminDashboard.css";

function AdminDashboard() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadProviders() {
    let currentStep = "Checking login";

    try {
      setLoading(true);
      setMessage("");

      await account.get();

      currentStep = "Checking admin team";

      const teamResponse = await teams.list();

      const isAdmin = teamResponse.teams.some(
        (team) => team.$id === "hub_admins"
      );

      if (!isAdmin) {
        setProviders([]);
        setMessage("Access denied. Admin team membership required.");
        return;
      }

      currentStep = "Loading provider records";

      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: "service_providers",
        queries: [Query.equal("status", "Pending")],
      });

      setProviders(response.rows);

    } catch (error) {
      console.log("Admin Dashboard Error:", error);
      setMessage(`${currentStep}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  async function updateProviderStatus(providerId, newStatus) {
    try {
      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: "service_providers",
        rowId: providerId,
        data: {
          status: newStatus,
        },
      });

      setMessage(
        `Provider ${newStatus.toLowerCase()} successfully!`
      );

      loadProviders();

    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Manage service provider registrations.</p>

      <h2>Pending Providers ({providers.length})</h2>

      {message && (
        <p className="admin-message">{message}</p>
      )}

      {loading ? (
        <p>Loading providers...</p>
      ) : providers.length === 0 ? (
        <p>No pending providers found.</p>
      ) : (
        <div className="admin-provider-list">
          {providers.map((provider) => (
            <div
              className="admin-provider-card"
              key={provider.$id}
            >
              <h3>{provider.businessName}</h3>

              <p>
                <strong>Category:</strong> {provider.serviceCategory}
              </p>

              <p>
                <strong>Phone:</strong> {provider.phone}
              </p>

              <p>
                <strong>Address:</strong> {provider.address}
              </p>

              <p>
                <strong>Experience:</strong> {provider.experience} years
              </p>

              <p>
                <strong>Description:</strong> {provider.description}
              </p>

              <p>
                <strong>Status:</strong> {provider.status}
              </p>

              <div className="admin-actions">
                <button
                  onClick={() =>
                    updateProviderStatus(provider.$id, "Approved")
                  }
                >
                  Approve
                </button>

                <button
                  onClick={() =>
                    updateProviderStatus(provider.$id, "Rejected")
                  }
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
