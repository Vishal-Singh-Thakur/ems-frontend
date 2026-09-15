import React, { useState } from "react";
import { Calendar, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import AppInput from "../AppInput";
import ApiHit from "../../Utils/ApiHit";
import { ApplyLeaveAPI } from "../Constant/Api/Api";
import { Button } from "../ui/button";

const ApplyLeave = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isOpen] = useState(true);


  const leaveTypes = [
    { value: "Sick Leave", label: "Sick Leave" },
    { value: "Casual Leave", label: "Casual Leave" },
    { value: "Earned Leave", label: "Earned Leave" },
    { value: "Maternity Leave", label: "Maternity Leave" },
    { value: "Paternity Leave", label: "Paternity Leave" },
    { value: "Unpaid Leave", label: "Unpaid Leave" }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    // Clear success and API error messages
    setSuccess(false);
    setApiError(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.leaveType) {
      newErrors.leaveType = "Leave type is required";
    }

    if (!formData.fromDate) {
      newErrors.fromDate = "Start date is required";
    }

    if (!formData.toDate) {
      newErrors.toDate = "End date is required";
    }

    // Check if end date is after start date
    if (formData.fromDate && formData.toDate) {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);

      if (end < start) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    if (!formData.reason || formData.reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateLeaveDays = () => {
    if (formData.fromDate && formData.toDate) {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setApiError(null);
      setSuccess(false);

      const leaveData = {
        leaveType: formData.leaveType,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        reason: formData.reason.trim()
      };

      console.log('📤 Submitting leave application:', leaveData);

      const response = await ApiHit(ApplyLeaveAPI, "POST", leaveData);

      if (response.success) {
        console.log('✅ Leave applied successfully:', response.data);
        setSuccess(true);

        // Reset form
        setFormData({
          leaveType: "",
          fromDate: "",
          toDate: "",
          reason: ""
        });

        // Notify parent + close after brief delay
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSuccess(false);
          if (onClose) onClose();
        }, 1500);

      } else {
        setApiError(response.message || "Failed to apply leave");
      }
    } catch (err) {
      console.error("Leave application error:", err);
      setApiError(err.message || "An error occurred while applying for leave");
    } finally {
      setLoading(false);
    }
  };

  // const handleReset = () => {
  //   setFormData({
  //     leaveType: "",
  //     fromDate: "",
  //     toDate: "",
  //     reason: "",
  //   });
  //   setErrors({});
  //   setSuccess(false);
  //   setApiError(null);
  //   setIsOpen(false);
  // };

  const leaveDays = calculateLeaveDays();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100">Apply for Leave</h1>
            <p className="text-gray-600 dark:text-slate-300 mt-1">Submit your leave application request</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-slate-100 transition"
          >
            <X size={22} />
          </button>
        </div>


        {/* Success Alert */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-4 flex items-center">
            <CheckCircle className="text-green-600 dark:text-green-400 mr-3" size={24} />
            <div>
              <p className="text-green-800 dark:text-green-300 font-semibold">Leave Applied Successfully!</p>
              <p className="text-green-700 dark:text-green-300 text-sm">Your leave application has been submitted for approval.</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {apiError && (
          <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4 flex items-center">
            <AlertCircle className="text-red-600 dark:text-red-400 mr-3" size={24} />
            <div>
              <p className="text-red-800 dark:text-red-300 font-semibold">Application Failed</p>
              <p className="text-red-700 dark:text-red-300 text-sm">{apiError}</p>
            </div>
          </div>
        )}

        {/* Leave Application Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="flex items-center">
              <Calendar className="mr-2" size={24} />
              Leave Application Form
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              {/* Leave Type Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.leaveType ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                    } ${loading ? 'bg-gray-100 dark:bg-slate-700/50 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.leaveType && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.leaveType}</p>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <AppInput
                  name="fromDate"
                  label="Start Date"
                  type="date"
                  value={formData.fromDate}
                  onChange={handleInputChange}
                  icon={<Calendar />}
                  required={true}
                  disabled={loading}
                  error={errors.fromDate}
                  min={new Date().toISOString().split('T')[0]}
                />

                <AppInput
                  name="toDate"
                  label="End Date"
                  type="date"
                  value={formData.toDate}
                  onChange={handleInputChange}
                  icon={<Calendar />}
                  required={true}
                  disabled={loading}
                  error={errors.toDate}
                  min={formData.fromDate || new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Leave Duration Display */}
              {leaveDays > 0 && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                  <p className="text-blue-800 dark:text-blue-300 font-semibold">
                    Leave Duration: <span className="text-blue-600 dark:text-blue-400">{leaveDays} day{leaveDays > 1 ? 's' : ''}</span>
                  </p>
                </div>
              )}

              {/* Reason */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  Reason for Leave <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Please provide a detailed reason for your leave request..."
                  rows={5}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.reason ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                    } ${loading ? 'bg-gray-100 dark:bg-slate-700/50 cursor-not-allowed' : ''}`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.reason && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.reason}</p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-slate-400 ml-auto">
                    {formData.reason.length} characters (min 10)
                  </p>
                </div>
              </div>


              {/* Additional Info */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <span className="font-semibold">Note:</span> Your leave application will be sent to your manager for approval.
                  You will be notified once a decision has been made.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <span className="flex items-center justify-center gap-2 w-full">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Submit Application
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Leave Balance Info */}
        {/* <Card className="shadow-lg border-0 mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Your Leave Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">15</p>
                <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">Available</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">8</p>
                <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">Used</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">2</p>
                <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">Pending</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">25</p>
                <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">Total</p>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
};

export default ApplyLeave;