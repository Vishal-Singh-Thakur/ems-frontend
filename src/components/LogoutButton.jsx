import React, { useState } from "react";
import ApiHit from "../Utils/ApiHit";
import { LogoutAPI } from "./Constant/Api/Api";

const LogoutButton = ({ onLogout }) => {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await ApiHit(LogoutAPI, "POST");
    } catch {
      console.error("Logout API failed");
    } finally {
      onLogout();
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full bg-red-600 text-white py-2 rounded-lg"
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
};

export default LogoutButton;
