import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Trash2 } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import DataTable from "../components/DataTable/DataTable";
import { CleanupSystemLogsAPI, GetAllSystemLogsAPI } from "../components/Constant/Api/Api";

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const logTypes = ["all", "login", "user", "admin", "error", "security", "logout"]; 

  // Fetch logs on component mount and when page/filter changes
  useEffect(() => {
    fetchSystemLogs(currentPage);
  }, [currentPage]);

  // Fetch all system logs from API
  const fetchSystemLogs = async (_page = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await ApiHit(GetAllSystemLogsAPI, "GET");

      console.log("API Response:", response);

      if (response.success && response.data) {
        // Ensure we always get an array
        let logsList = response.data.docs || response.data.logs || response.data;
        
        // If logsList is not an array, try to convert it or set empty array
        if (!Array.isArray(logsList)) {
          console.warn("Logs data is not an array:", logsList);
          logsList = [];
        }
        
        const total = response.data.totalPages || Math.ceil((response.data.total || logsList.length) / 10);
        
        setLogs(logsList);
        setTotalPages(total);
      } else {
        setError(response.message || "Failed to fetch logs");
        setLogs([]);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError("Network error while fetching logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup old logs
  const handleCleanup = async () => {
    if (!window.confirm("Are you sure you want to cleanup old logs? This action cannot be undone.")) {
      return;
    }

    try {
      setCleaning(true);
      setError("");

      const response = await ApiHit(CleanupSystemLogsAPI, "DELETE");

      if (response.success) {
        alert("Old logs cleaned up successfully!");
        setCurrentPage(1);
        fetchSystemLogs(1);
      } else {
        setError(response.message || "Failed to cleanup logs");
        alert("Failed to cleanup logs");
      }
    } catch (err) {
      console.error("Error cleaning logs:", err);
      setError("Network error while cleaning logs");
      alert("Network error. Please try again.");
    } finally {
      setCleaning(false);
    }
  };

  // Filter logs based on search AND type - THIS WAS THE MISSING PART
  const filteredLogs = Array.isArray(logs) 
    ? logs.filter((log) => {
        // Filter by type first
        if (filterType !== "all" && log.type?.toLowerCase() !== filterType.toLowerCase()) {
          return false;
        }
        
        // Then filter by search
        if (!search) return true;
        
        const searchLower = search.toLowerCase();
        
        // Get user name for search
        const userName = (log.user && typeof log.user === 'object') 
          ? (log.user.name || log.user.username || log.user.email || "")
          : (log.userName || log.user || "");
        
        return (
          userName.toLowerCase().includes(searchLower) ||
          log.action?.toLowerCase().includes(searchLower) ||
          log.description?.toLowerCase().includes(searchLower) ||
          log.ip?.toLowerCase().includes(searchLower) ||
          log.ipAddress?.toLowerCase().includes(searchLower)
        );
      })
    : [];

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get badge color based on log type
  const getTypeBadgeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "login":
        return "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300";
      case "user":
        return "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300";
      case "admin":
        return "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300";
      case "error":
        return "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300";
      case "security":
        return "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300";
      case "logout":
        return "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300";
      default:
        return "bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200";
    }
  };

  // Table headers
  const tableHeaders = ["S.No.","Timestamp", "User", "Type", "Action", "Description", "IP Address"];

  // Get user name from log object
  const getUserName = (log) => {
    // Check if user is an object with name/username
    if (log.user && typeof log.user === 'object') {
      return log.user.name || log.user.username || log.user.email || "Unknown User";
    }
    // Check if userName is directly available
    return log.userName || log.user || "System";
  };

  // Table rows
  const tableRows = filteredLogs.length > 0 ? (
    filteredLogs.map((log, index) => (
      <tr key={log._id || log.id} className="border-b hover:bg-gray-50 dark:hover:bg-slate-700/50 transition text-center">
      <td className="py-3 px-4 text-sm">{index + 1}</td>
        <td className="py-3 px-4 text-sm">
          {formatTimestamp(log.timestamp || log.createdAt)}
        </td>
        <td className="py-3 px-4 font-medium">
          {getUserName(log)}
        </td>
        <td className="py-3 px-4">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeBadgeColor(log.type)}`}>
            {log.type || "N/A"}
          </span>
        </td>
        <td className="py-3 px-4">{log.action || "N/A"}</td>
        <td className="py-3 px-4 text-gray-600 dark:text-slate-300 text-sm">
          {log.description || "No description"}
        </td>
        <td className="py-3 px-4 text-sm font-mono">
          {log.ip || log.ipAddress || "N/A"}
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td className="py-8 text-center text-gray-500 dark:text-slate-400" colSpan="6">
        {loading ? "Loading..." : search || filterType !== "all" ? "No matching logs found" : "No logs found"}
      </td>
    </tr>
  );

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-3 sm:p-5 md:p-8 lg:p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">System Logs</h1>
        
        <Button 
          onClick={handleCleanup}
          disabled={cleaning || loading}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
        >
          {cleaning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Cleaning...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Cleanup Old Logs
            </>
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Activity Logs ({filteredLogs.length} records)</CardTitle>
        </CardHeader>

        <CardContent>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search logs..."
              className="border px-4 py-2 rounded-lg w-1/3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
            >
              {logTypes.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Data Table */}
          <DataTable
            th={tableHeaders}
            td={tableRows}
            totalPages={totalPages}
            api={handlePageChange}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemLogs;
