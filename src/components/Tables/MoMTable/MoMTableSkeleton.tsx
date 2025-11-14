"use client";

export const MoMTableSkeleton = () => {
  // Show 5 placeholder rows
  const placeholderRows = Array.from({ length: 5 });

  return (
    <div className="overflow-x-auto p-4">
      <div className="h-6 w-1/3 rounded bg-gray-200 mb-2 animate-pulse"></div>
      <table className="min-w-full table-auto border border-gray-200 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2 text-left">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            </th>
            <th className="border px-3 py-2 text-right">
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
            </th>
            <th className="border px-3 py-2 text-right">
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          {placeholderRows.map((_, idx) => (
            <tr key={idx} className="border-b">
              <td className="border px-3 py-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </td>
              <td className="border px-3 py-2 text-right">
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </td>
              <td className="border px-3 py-2 text-right">
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
