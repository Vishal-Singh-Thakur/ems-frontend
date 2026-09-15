import React from "react";

const MyButton = ({ title, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm transition-all ${className}`}
    >
      {title}
    </button>
  );
};

export default MyButton;
