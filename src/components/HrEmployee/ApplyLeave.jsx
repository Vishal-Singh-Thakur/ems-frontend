// import React, { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
// import { Button } from "../ui/button";

// const ApplyLeave = ({ onClose, onSave }) => {
//   const [formData, setFormData] = useState({
//     employee: "",
//     type: "",
//     from: "",
//     to: "",
//   });

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = () => {
//     const { employee, type, from, to } = formData;

//     if (!employee || !type || !from || !to) {
//       return alert("Please fill all fields");
//     }

//     onSave({
//       ...formData,
//       id: Date.now(),
//       status: "Pending",
//     });

//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
//       <Card className="w-[420px]">
//         <CardHeader>
//           <CardTitle>Apply Leave</CardTitle>
//         </CardHeader>

//         <CardContent className="space-y-4">
//           <input
//             type="text"
//             name="employee"
//             placeholder="Employee Name"
//             className="border px-4 py-2 rounded-lg w-full"
//             value={formData.employee}
//             onChange={handleChange}
//           />

//           <select
//             name="type"
//             className="border px-4 py-2 rounded-lg w-full"
//             value={formData.type}
//             onChange={handleChange}
//           >
//             <option value="">Select Leave Type</option>
//             <option value="Sick Leave">Sick Leave</option>
//             <option value="Casual Leave">Casual Leave</option>
//             <option value="Work From Home">Work From Home</option>
//             <option value="Paid Leave">Paid Leave</option>
//           </select>

//           <div className="grid grid-cols-2 gap-4">
//             <input
//               type="date"
//               name="from"
//               className="border px-4 py-2 rounded-lg w-full"
//               value={formData.from}
//               onChange={handleChange}
//             />

//             <input
//               type="date"
//               name="to"
//               className="border px-4 py-2 rounded-lg w-full"
//               value={formData.to}
//               onChange={handleChange}
//             />
//           </div>

//           <div className="flex justify-end mt-6 gap-3">
//             <Button variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button onClick={handleSubmit}>Submit</Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default ApplyLeave;



import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import AppInput from "../AppInput";
import ApiDropdown from "../ApiDropdown";
import { REGEX_PATTERNS, VALIDATION_MESSAGES } from "../../Utils/regex";
import { IoPerson, IoCalendar, IoCalendarNumber, IoCheckmarkCircle } from "react-icons/io5";

const ApplyLeave = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    employee: "",
    type: "",
    from: "",
    to: "",
  });

  const [errors, setErrors] = useState({});

  // HANDLE CHANGE
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // clear error on typing
  };

  // VALIDATION
  const validateForm = () => {
    let newErrors = {};

    if (!formData.employee) {
      newErrors.employee = VALIDATION_MESSAGES.required;
    } else if (!REGEX_PATTERNS.name.test(formData.employee)) {
      newErrors.employee = VALIDATION_MESSAGES.name;
    }

    if (!formData.type) newErrors.type = VALIDATION_MESSAGES.required;
    if (!formData.from) newErrors.from = VALIDATION_MESSAGES.required;
    if (!formData.to) newErrors.to = VALIDATION_MESSAGES.required;

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // SUBMIT
  const handleSubmit = () => {
    if (!validateForm()) return;

    onSave({
      ...formData,
      id: Date.now(),
      status: "Pending",
    });

    // Reset form
    setFormData({
      employee: "",
      type: "",
      from: "",
      to: "",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>Apply Leave</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Employee Name */}
          <AppInput
            name="employee"
            label="Employee Name"
            placeholder="Enter employee name"
            value={formData.employee}
            onChange={handleChange}
            icon={<IoPerson />}
            error={errors.employee}
            required
          />

          {/* Leave Type */}
          <ApiDropdown
            name="type"
            label="Leave Type"
            value={formData.type}
            onChange={handleChange}
            options={[
              { label: "Sick Leave", value: "Sick Leave" },
              { label: "Casual Leave", value: "Casual Leave" },
              { label: "Work From Home", value: "Work From Home" },
              { label: "Paid Leave", value: "Paid Leave" },
            ]}
            icon={<IoCheckmarkCircle />}
            error={errors.type}
            required
          />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <AppInput
              name="from"
              label="From Date"
              type="date"
              value={formData.from}
              onChange={handleChange}
              icon={<IoCalendar />}
              error={errors.from}
              required
            />
            <AppInput
              name="to"
              label="To Date"
              type="date"
              value={formData.to}
              onChange={handleChange}
              icon={<IoCalendarNumber />}
              error={errors.to}
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end mt-6 gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyLeave;
