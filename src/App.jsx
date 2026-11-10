import Auth from "./Auth";
import ProviderDashboard from "./ProviderDashboard";
import CustomerBookingHistory from "./CustomerBookingHistory";
import ProviderRegistration from "./ProviderRegistration";
import AdminDashboard from "./AdminDashboard";
import { useState, useEffect, useRef } from "react";
import { account, teams, tablesDB, DATABASE_ID } from "./appwrite";
import { Query, ID, Permission, Role } from "appwrite";
import "./App.css";

const services = [
  {
    name: "Plumbing",
    icon: "🔧",
    detail: "Pipes, taps and water repairs",
    image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=700"
  },
  {
    name: "Electrical",
    icon: "⚡",
    detail: "Wiring, switches and repairs",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=700"
  },
  {
    name: "Painting",
    icon: "🎨",
    detail: "Home and office painting",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=700"
  },
  {
    name: "Carpentry",
    icon: "🪚",
    detail: "Furniture and woodwork",
    image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=700"
  },
  {
  name: "AC Repair",
  icon: "❄️",
  detail: "AC service and maintenance",
  image: "https://images.pexels.com/photos/5463582/pexels-photo-5463582.jpeg?auto=compress&cs=tinysrgb&w=700"
  },
  {
    name: "Cleaning",
    icon: "🧹",
    detail: "Home and office cleaning",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=700"
  },
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const bookingLock = useRef(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showCustomerBookingHistory, setShowCustomerBookingHistory] = useState(false);
  const [showProviderDashboard, setShowProviderDashboard] = useState(false);
  const [isApprovedProvider, setIsApprovedProvider] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

useEffect(() => {
  async function checkUser() {
    try {
      const user = await account.get();
setIsLoggedIn(true);
setIsApprovedProvider(false);

const providerResponse = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: "service_providers",
  queries: [
    Query.equal("userId", user.$id),
    Query.equal("status", "Approved"),
  ],
});

setIsApprovedProvider(providerResponse.rows.length > 0);

      const teamResponse = await teams.list();

      const adminMember = teamResponse.teams.some(
        (team) => team.$id === "hub_admins"
      );

      setIsAdmin(adminMember);
    } catch (error) {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  }

  checkUser();
}, []);

async function handleLogout() {
  try {
    await account.deleteSession({ sessionId: "current" });
    setIsLoggedIn(false);
    setMessage("You have logged out successfully!");
  } catch (error) {
    setMessage(error.message);
  }
}
  const [search, setSearch] = useState("");
  const [providers, setProviders] = useState([]);
const [loadingProviders, setLoadingProviders] = useState(true);

useEffect(() => {
  async function loadApprovedProviders() {
    try {
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: "service_providers",
        queries: [Query.equal("status", "Approved")],
      });

      setProviders(response.rows);
      console.log("Approved Providers:", response.rows);
    } catch (error) {
      console.log("Provider loading error:", error.message);
    } finally {
      setLoadingProviders(false);
    }
  }

  loadApprovedProviders();
}, []);

  const [selectedService, setSelectedService] = useState("All");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [message, setMessage] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [showProviderRegistration, setShowProviderRegistration] = useState(false);

  const filteredProviders = providers.filter((provider) => {
  const matchesSearch =
    provider.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    provider.serviceCategory?.toLowerCase().includes(search.toLowerCase()) ||
    provider.address?.toLowerCase().includes(search.toLowerCase());

  const matchesService =
    selectedService === "All" ||
    provider.serviceCategory === selectedService;

  return matchesSearch && matchesService;
});

  

async function handleBooking(event) {
  event.preventDefault();

  if (bookingLock.current) return;

  bookingLock.current = true;
  setBookingLoading(true);

  const form = event.currentTarget;
  const formData = new FormData(form);

  try {
    const user = await account.get();

    console.log("Customer ID:", user.$id);
    console.log("Provider ID:", selectedProvider.$id);
    console.log("Provider User ID:", selectedProvider.userId);

    const customerName = formData.get("customerName");
    const customerPhone = formData.get("customerPhone");
    const serviceAddress = formData.get("serviceAddress");
    const preferredDate = formData.get("preferredDate");

    // Check for an existing booking
    const existingBookings = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: "bookings",
      queries: [
        Query.equal("customerId", user.$id),
        Query.equal("providerId", selectedProvider.$id),
        Query.equal("preferredDate", preferredDate),
        Query.equal("serviceCategory", selectedProvider.serviceCategory),
      ],
    });

    const activeStatuses = ["Pending", "Accepted", "Approved"];

const duplicateBooking = existingBookings.rows.some(
  (booking) => activeStatuses.includes(booking.status)
);

    if (duplicateBooking) {
      setMessage(
        "You already have an active booking with this provider for this date!"
      );
      return;
    }

    // Create new booking
await tablesDB.createRow({
  databaseId: DATABASE_ID,
  tableId: "bookings",
  rowId: ID.unique(),
  data: {
    customerId: user.$id,
    providerId: selectedProvider.$id,
    providerUserId: selectedProvider.userId,
    customerName,
    customerPhone,
    serviceAddress,
    preferredDate,
    serviceCategory: selectedProvider.serviceCategory,
    status: "Pending",
  },
  permissions: [
    // Customer can view their own booking
    Permission.read(Role.user(user.$id)),

    // Admin team access will be configured separately
  ],
      });

    setSelectedProvider(null);
    setMessage("Your booking request has been submitted!");

    form.reset();

    setTimeout(() => {
      setMessage("");
    }, 4000);

  } catch (error) {
    console.log("Booking Error:", error);
    setMessage("Booking failed: " + error.message);

  } finally {
    bookingLock.current = false;
    setBookingLoading(false);
  }
}



  return (
    <div className="app">
      
<nav className="navbar">
  <a href="#home" className="logo">
    <span>🛠️</span> Smart Service Hub
  </a>

  <div className="nav-links">
    <a href="#home">Home</a>
    <a href="#services">Services</a>
    <a href="#providers">Find Professionals</a>
  </div>

  <div className="nav-actions">
    <button
      className="nav-button"
      onClick={() => setShowProviderRegistration(true)}
    >
      Become a Provider
    </button>

    {isAdmin && (
      <button
        className="nav-button"
        onClick={() => setShowAdminDashboard(true)}
      >
        Admin Dashboard
      </button>
    )}

    {isLoggedIn && isApprovedProvider && (
      <button
        className="nav-button"
        onClick={() => setShowProviderDashboard(true)}
      >
        Provider Dashboard
      </button>
    )}

    {isLoggedIn ? (
      <>
        <button
          className="nav-button"
          onClick={() => setShowCustomerBookingHistory(true)}
        >
          My Bookings
        </button>

        <button
          className="nav-button logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </>
    ) : (
      <button
        className="nav-button"
        onClick={() => setShowAuth(true)}
      >
        Login / Signup
      </button>
    )}
  </div>
</nav>


<section className="hero" id="home">
  <div className="hero-content">
    <span className="hero-tag">
      YOUR LOCAL SERVICE PARTNER
    </span>

    <h1>
      Find Trusted Professionals
      <br />
      For Your <span>Everyday Needs</span>
    </h1>

    <p>
      Connect with skilled and reliable service providers
      for your home and business. Book trusted professionals
      quickly and easily.
    </p>

    <div className="search-box">
      <span>🔍</span>
      <input
        type="text"
        placeholder="Search plumber, electrician, painter..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <button
        onClick={() =>
          document.getElementById("providers").scrollIntoView({
            behavior: "smooth",
          })
        }
      >
        Search
      </button>
    </div>

    <div className="hero-features">
      <span>✓ Verified Professionals</span>
      <span>✓ Easy Booking</span>
      <span>✓ Reliable Services</span>
    </div>
  </div>

  <div className="hero-visual">
    <div className="hero-photo-wrapper">
      <img
        src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1000"
        alt="Professional home service technician"
        className="hero-photo"
      />

      <div className="hero-photo-badge">
        <span>✓</span>
        Trusted Local Professionals
      </div>

      <div className="hero-floating-card">
        <span>🏠</span>
        <div>
          <strong>Home Services Made Easy</strong>
          <small>One platform, multiple services</small>
        </div>
      </div>
    </div>

    <div className="hero-service-list">
  <div className="hero-service-item">
    <span>🔧</span>
    <div>
      <strong>Plumbing</strong>
      <small>Professional plumbers</small>
    </div>
    <span>✓</span>
  </div>

  <div className="hero-service-item">
    <span>⚡</span>
    <div>
      <strong>Electrical</strong>
      <small>Expert electricians</small>
    </div>
    <span>✓</span>
  </div>

  <div className="hero-service-item">
    <span>🎨</span>
    <div>
      <strong>Painting</strong>
      <small>Quality workmanship</small>
    </div>
    <span>✓</span>
  </div>

  <div className="hero-service-item">
    <span>🪚</span>
    <div>
      <strong>Carpentry</strong>
      <small>Skilled woodwork experts</small>
    </div>
    <span>✓</span>
  </div>

  <div className="hero-service-item">
    <span>❄️</span>
    <div>
      <strong>AC Repair</strong>
      <small>AC service and maintenance</small>
    </div>
    <span>✓</span>
  </div>

  <div className="hero-service-item">
    <span>🧹</span>
    <div>
      <strong>Cleaning</strong>
      <small>Professional cleaning services</small>
    </div>
    <span>✓</span>
  </div>
</div>
</div>
</section>

      <section className="services section" id="services">
        <div className="section-heading">
          <span className="section-tag">WHAT WE OFFER</span>
          <h2>Explore Our Services</h2>
          <p>Find the right professional for your needs.</p>
        </div>

        <div className="service-grid">
          {services.map((service) => (
  <button
    className={`service-card ${
      selectedService === service.name ? "active" : ""
    }`}
    key={service.name}
    onClick={() => {
      setSelectedService(service.name);
      document.getElementById("providers").scrollIntoView({
        behavior: "smooth",
      });
    }}
  >
    <div className="service-image-wrapper">
      <img
        src={service.image}
        alt={service.name}
        className="service-image"
        loading="lazy"
      />
    </div>

    <div className="service-card-content">
      <span className="service-icon">{service.icon}</span>
      <h3>{service.name}</h3>
      <p>{service.detail}</p>
    </div>
  </button>
))}
        </div>
      </section>

      <section className="providers section" id="providers">
        <div className="section-heading">
          <span className="section-tag">OUR PROFESSIONALS</span>
          <h2>Find Service Providers</h2>
          <p>Browse available professionals and request a booking.</p>
        </div>

        <div className="filter-bar">
          <select
            value={selectedService}
            onChange={(event) => setSelectedService(event.target.value)}
          >
            <option value="All">All Services</option>
            {services.map((service) => (
              <option value={service.name} key={service.name}>
                {service.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search by name, service or city..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <button
            className="reset-button"
            onClick={() => {
              setSearch("");
              setSelectedService("All");
            }}
          >
            Reset
          </button>
        </div>

        
<div className="provider-grid">
  {loadingProviders ? (
    <p>Loading approved providers...</p>
  ) : filteredProviders.length === 0 ? (
    <p>No approved service providers available yet.</p>
  ) : (
    filteredProviders.map((provider) => (
      <div className="provider-card" key={provider.$id}>
        <div className="provider-avatar">
  {provider.businessName?.charAt(0).toUpperCase() || "P"}
</div>
        <span className="verified">✓ Verified</span>

        <h3>{provider.businessName}</h3>
        <p className="profession">{provider.serviceCategory}</p>

        <div className="provider-info">
          <span>✓ Approved Provider</span>
        </div>

        <p className="location">📍 {provider.address}</p>

        <div className="provider-bottom">
          <strong>{provider.experience} years experience</strong>
          <button onClick={() => setSelectedProvider(provider)}>
            Book Now
          </button>
        </div>
      </div>
    ))
  )}
</div>

      </section>

      <section className="how-it-works section">
        <div className="section-heading">
          <span className="section-tag">SIMPLE PROCESS</span>
          <h2>How It Works</h2>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <span>01</span>
            <h3>Choose a Service</h3>
            <p>Select the service you need.</p>
          </div>

          <div className="step-card">
            <span>02</span>
            <h3>Find a Professional</h3>
            <p>Browse available service providers.</p>
          </div>

          <div className="step-card">
            <span>03</span>
            <h3>Book Your Service</h3>
            <p>Submit your booking request.</p>
          </div>
        </div>
      </section>



      {selectedProvider && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedProvider(null)}
        >
          <div className="booking-modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="close-modal"
              onClick={() => setSelectedProvider(null)}
              aria-label="Close booking form"
            >
              ×
            </button>

            <h2>Book a Service</h2>

<p>
  Booking with <strong>{selectedProvider.businessName}</strong>
</p>

<form onSubmit={handleBooking}>
  <label>
    Your Name
    <input
      name="customerName"
      required
      placeholder="Enter your name"
    />
  </label>

  <label>
    Phone Number
    <input
      name="customerPhone"
      required
      type="tel"
      placeholder="Enter phone number"
    />
  </label>

  <label>
    Service Address
    <textarea
      name="serviceAddress"
      required
      placeholder="Enter your address"
    />
  </label>

  <label>
    Preferred Date
    <input
      name="preferredDate"
      required
      type="date"
      min={new Date().toISOString().split("T")[0]}
    />
  </label>

  <button
  className="submit-booking"
  type="submit"
  disabled={bookingLoading}
>
  {bookingLoading ? "Submitting..." : "Submit Booking Request"}
</button>
</form>
          </div>
        </div>
      )}

      {message && <div className="toast">✓ {message}</div>}

      {showProviderRegistration && (
  <div
    className="modal-overlay"
    onClick={() => setShowProviderRegistration(false)}
  >
    <div
      className="booking-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="close-modal"
        onClick={() => setShowProviderRegistration(false)}
        aria-label="Close provider registration"
      >
        ×
      </button>

      <ProviderRegistration />
    </div>
  </div>
)}

{showAdminDashboard && (
  <div className="admin-modal-overlay">
    <button
      className="admin-close-button"
      onClick={() => setShowAdminDashboard(false)}
    >
      Back to Home
    </button>

    <AdminDashboard />
  </div>
)}

{showProviderDashboard && (
  <div className="admin-modal-overlay">
    <button
      className="admin-close-button"
      onClick={() => setShowProviderDashboard(false)}
    >
      Back to Home
    </button>

    <ProviderDashboard />
  </div>
)}

{showCustomerBookingHistory && (
  <div className="admin-modal-overlay">
    <button
      className="admin-close-button"
      onClick={() => setShowCustomerBookingHistory(false)}
    >
      Back to Home
    </button>

    <CustomerBookingHistory />
  </div>
)}

     
{showAuth && (
  <Auth
    onClose={() => setShowAuth(false)}
    onSuccess={async (text) => {
      setShowAuth(false);
      setIsLoggedIn(true);

      try {
        const user = await account.get();

        // Admin check
        const teamResponse = await teams.list();

        const adminMember = teamResponse.teams.some(
          (team) => team.$id === "hub_admins"
        );

        setIsAdmin(adminMember);

        // Approved Provider check
        const providerResponse = await tablesDB.listRows({
          databaseId: DATABASE_ID,
          tableId: "service_providers",
          queries: [
            Query.equal("userId", user.$id),
            Query.equal("status", "Approved"),
          ],
        });

        setIsApprovedProvider(providerResponse.rows.length > 0);

      } catch (error) {
        setIsAdmin(false);
        setIsApprovedProvider(false);

        console.log("Login role check error:", error.message);
      }

      setMessage(text);
      setTimeout(() => setMessage(""), 4000);
    }}
  />
)}

<footer className="footer">
  <div className="footer-content">
    <div className="footer-brand">
      <h2>🛠️ Smart Service Hub</h2>
      <p>
        Find trusted professionals for your everyday home
        and business service needs.
      </p>
    </div>

    <div className="footer-links">
      <h3>Quick Links</h3>
      <a href="#home">Home</a>
      <a href="#services">Services</a>
      <a href="#providers">Find Professionals</a>
    </div>

    <div className="footer-links">
      <h3>Our Services</h3>
      <span>Plumbing</span>
      <span>Electrical</span>
      <span>Cleaning</span>
      <span>AC Repair</span>
    </div>
  </div>

  <div className="footer-bottom">
    <p>© {new Date().getFullYear()} Smart Service Hub. All rights reserved.</p>
  </div>
</footer>
    </div>
  );
}

export default App;
