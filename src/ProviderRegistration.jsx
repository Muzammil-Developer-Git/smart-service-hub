import "./ProviderRegistration.css";
import { useState } from "react";
import { ID, Permission, Role } from "appwrite";
import {
  account,
  tablesDB,
  DATABASE_ID,
} from "./appwrite";

function ProviderRegistration() {
  const [form, setForm] = useState({
    businessName: "",
    serviceCategory: "Plumbing",
    phone: "",
    address: "",
    description: "",
    experience: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const user = await account.get();

      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: "service_providers",
        rowId: ID.unique(),
        data: {
          userId: user.$id,
          businessName: form.businessName,
          serviceCategory: form.serviceCategory,
          phone: form.phone,
          address: form.address,
          description: form.description,
          experience: Number(form.experience),
          status: "Pending",
        },
        permissions: [
  Permission.read(Role.user(user.$id)),
  Permission.update(Role.user(user.$id)),

  Permission.read(Role.team("hub_admins")),
  Permission.update(Role.team("hub_admins")),
],
      });

      setMessage("Provider registration submitted successfully!");

      setForm({
        businessName: "",
        serviceCategory: "Plumbing",
        phone: "",
        address: "",
        description: "",
        experience: "",
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="provider-registration">
      <h2>Service Provider Registration</h2>
      <p>Register your business and offer your services.</p>

      <form onSubmit={handleSubmit}>
        <label>Business Name</label>
        <input
          name="businessName"
          value={form.businessName}
          onChange={handleChange}
          required
        />

        <label>Service Category</label>
        <select
          name="serviceCategory"
          value={form.serviceCategory}
          onChange={handleChange}
        >
          <option>Plumbing</option>
          <option>Electrical</option>
          <option>Painting</option>
          <option>Carpentry</option>
          <option>AC Repair</option>
          <option>Cleaning</option>
        </select>

        <label>Phone</label>
        <input
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <label>Address</label>
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          required
        />

        <label>Experience (Years)</label>
        <input
          name="experience"
          type="number"
          min="0"
          value={form.experience}
          onChange={handleChange}
          required
        />

        <label>About Your Services</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Register as Provider"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default ProviderRegistration;