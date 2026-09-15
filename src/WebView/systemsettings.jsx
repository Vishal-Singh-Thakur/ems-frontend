import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import ApiHit from "../Utils/ApiHit";
import { GetSystemSettingsAPI, UpdateSystemSettingsAPI } from "../components/Constant/Api/Api";
import { applyTheme } from "../Utils/theme";

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    companyName: "",
    timezone: "Asia/Kolkata",
    allowSystemNotifications: true,
    autoLogoutMinutes: 30,
    theme: "light",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch system settings on mount
  useEffect(() => {
    fetchSystemSettings();
  }, []);

  // Fetch settings from API
  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await ApiHit(GetSystemSettingsAPI, "GET");

      if (response.success && response.data) {
        setSettings({
          companyName: response.data.companyName || "",
          timezone: response.data.timezone || "Asia/Kolkata",
          allowSystemNotifications: response.data.allowSystemNotifications ?? true,
          autoLogoutMinutes: response.data.autoLogoutMinutes || 30,
          theme: response.data.theme || "light",
        });
        applyTheme(response.data.theme || "light");
      } else {
        setError(response.message || "Failed to fetch settings");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Network error while fetching settings");
    } finally {
      setLoading(false);
    }
  };

  // Update individual field
  const handleChange = (field, value) => {
    if (field === 'theme') applyTheme(value); // live preview
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save settings to API
  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const response = await ApiHit(UpdateSystemSettingsAPI, "PUT", settings);

      if (response.success) {
        applyTheme(settings.theme);
        alert("System Settings Saved Successfully!");
      } else {
        setError(response.message || "Failed to save settings");
        alert("Failed to save settings. Please try again.");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Network error while saving settings");
      alert("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-5 md:p-8 lg:p-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-slate-300">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 md:p-8 lg:p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">System Settings</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block mb-1 font-medium">Company Name</label>
            <input
              type="text"
              className="border w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={settings.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder="Enter company name"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block mb-1 font-medium">Timezone</label>
            <select
              className="border px-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={settings.timezone}
              onChange={(e) => handleChange("timezone", e.target.value)}
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Asia/Singapore">Asia/Singapore</option>
            </select>
          </div>

          {/* Notification Setting */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/40 rounded-lg">
            <div>
              <label className="font-medium block mb-1">Allow System Notifications</label>
              <p className="text-sm text-gray-600 dark:text-slate-300">Enable or disable system-wide notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.allowSystemNotifications}
                onChange={(e) => handleChange("allowSystemNotifications", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Auto Logout */}
          <div>
            <label className="block mb-1 font-medium">Auto Logout (minutes)</label>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">
              Automatically logout users after inactivity
            </p>
            <input
              type="number"
              className="border px-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={settings.autoLogoutMinutes}
              min="1"
              max="1440"
              onChange={(e) => handleChange("autoLogoutMinutes", parseInt(e.target.value))}
            />
          </div>

          {/* Theme */}
          <div>
            <label className="block mb-1 font-medium">Theme</label>
            <select
              className="border px-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={settings.theme}
              onChange={(e) => handleChange("theme", e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System Default)</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={fetchSystemSettings}
              disabled={saving || loading}
              className="border-gray-300 dark:border-slate-600"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Settings Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
            <p>• Changes will apply to all users immediately after saving</p>
            <p>• Auto logout timer resets on user activity</p>
            <p>• Timezone affects all date/time displays in the system</p>
            <p>• Theme preference can be overridden by individual users</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;