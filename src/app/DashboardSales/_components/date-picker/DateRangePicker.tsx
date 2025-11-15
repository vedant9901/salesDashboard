"use client";

import { useState, useEffect } from "react";

export default function DateRangePicker({
  onChange,
}: {
  onChange: (start: string, end: string) => void;
}) {
  // Get today's date
  const today = new Date();

  // Start = 1st day of month
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  // End = yesterday
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Format YYYY-MM-DD
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // Initialize state
  const [startDate, setStartDate] = useState(formatDate(firstDay));
  const [endDate, setEndDate] = useState(formatDate(yesterday));

  // Notify parent on change
  useEffect(() => {
    onChange(startDate, endDate);
  }, [startDate, endDate, onChange]);

  return (
    <div id="date-range-picker" className="flex items-center gap-2">
      {/* Start Date */}
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
          </svg>
        </div>

        <input
          id="datepicker-range-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
                     focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5
                     dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
                     dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Select start date"
        />
      </div>

      <span className="mx-2 text-gray-500">to</span>

      {/* End Date */}
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
          </svg>
        </div>

        <input
          id="datepicker-range-end"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
                     focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5
                     dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
                     dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Select end date"
        />
      </div>
    </div>
  );
}
