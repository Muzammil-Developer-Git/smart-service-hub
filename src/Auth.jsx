
import { useState, useEffect } from "react";
import { ID, Permission, Role } from "appwrite";
import {
  account,
  tablesDB,
  DATABASE_ID,
  TABLE_ID,
} from "./appwrite";
import "./Auth.css";

function Auth({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    account.get()
      .then((user) => {
        setLoggedIn(true);
        setUserName(user.name);
      })
      .catch(() => {
        setLoggedIn(false);
      });
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        const user = await account.create({
          userId: ID.unique(),
          email,
          password,
          name,
        });

        await account.createEmailPasswordSession({
          email,
          password,
        });

        await tablesDB.createRow({
          databaseId: DATABASE_ID,
          tableId: TABLE_ID,
          rowId: ID.unique(),
          data: {
            name,
            email,
            phone,
            role: "customer",
          },
          permissions: [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ],
        });

        setUserName(name);
        setLoggedIn(true);
        onSuccess("Account and customer profile created successfully!");
      } else {
        await account.createEmailPasswordSession({
          email,
          password,
        });

        const user = await account.get();
        setUserName(user.name);
        setLoggedIn(true);
        onSuccess("Login successful! Welcome back.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setError("");
    setLoading(true);

    try {
      await account.deleteSession({ sessionId: "current" });
      setLoggedIn(false);
      setUserName("");
      setMode("login");
      setEmail("");
      setPassword("");
      onSuccess("You have logged out successfully!");
    } catch (err) {
      setError(err.message || "Logout failed.");
    } finally {
      setLoading(false);
    }
  }

  if (loggedIn) {
    return (
      <div className="auth-overlay" onClick={onClose}>
        <div
          className="auth-card"
          onClick={(event) => event.stopPropagation()}
        >
          <button className="auth-close" onClick={onClose} type="button">
            ×
          </button>

          <div className="auth-logo">🛠️</div>
          <h2>Welcome, {userName}!</h2>
          <p className="auth-subtitle">
            You are logged in to Smart Service Hub.
          </p>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="auth-submit"
            type="button"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Logout"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-card"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="auth-close" onClick={onClose} type="button">
          ×
        </button>

        <div className="auth-logo">🛠️</div>

        <h2>
          {mode === "login" ? "Welcome Back!" : "Create Your Account"}
        </h2>

        <p className="auth-subtitle">
          {mode === "login"
            ? "Login to continue to Smart Service Hub."
            : "Join Smart Service Hub and find trusted professionals."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "selected" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={mode === "signup" ? "selected" : ""}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label>
                Full Name
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label>
                Phone Number
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
            </>
          )}

          <label>
            Email Address
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>

          {mode === "signup" && (
            <label>
              Confirm Password
              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
           </label>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login to Account"
                : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;
