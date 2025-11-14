import { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { cn, standardFormat, getRGMColor, formatMonthName } from "@/lib/utils";
import MixBarChart from "@/components/Charts/MixBarChart/MixBarChart";
import { AiOutlineClose } from "react-icons/ai";

interface Props {
  storeCode: string | string[];
  startDate: string;
  endDate: string;
  toggleValue: boolean;
  currentPage?: number;
  onNextPage?: (dept?: string | null) => void;
  onPreviousPage?: (dept?: string | null) => void;
  onDepartmentChange?: (dept: string | null) => void;
  initialDepartment?: string | null; // ✅ Add this
}

export default function MarginReportClient({
  storeCode,
  startDate,
  endDate,
  toggleValue,
  currentPage,
  onNextPage,
  onPreviousPage,
  onDepartmentChange,
  initialDepartment,
}: Props) {
  const {
    items = [],
    momData = [],
    status,
  } = useSelector((state: RootState) => state.marginReport ?? {});
  const dispatch = useDispatch<AppDispatch>();

  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );
  const [selectedMoMDept, setSelectedMoMDept] = useState<string | null>(null);
  const [hasUserCleared, setHasUserCleared] = useState(false);
  // ✅ Extract unique department list from MoM data
  const departmentList =
    momData && momData.length > 0
      ? Array.from(
          new Set(
            momData.flatMap((m) =>
              (m.Departments || []).map((d) => d.Department),
            ),
          ),
        )
      : [];
  useEffect(() => {
    if (momData?.length > 0 && !selectedDepartment && !hasUserCleared) {
      const firstDept =
        momData[0]?.Departments?.[0]?.Department ||
        momData.flatMap((m) => m.Departments.map((d) => d.Department))[0] ||
        null;

      if (firstDept) setSelectedDepartment(firstDept);
    }
  }, [momData, selectedDepartment, hasUserCleared]);

  useEffect(() => {
    if (initialDepartment && !selectedMoMDept) {
      setSelectedMoMDept(initialDepartment);
    }
  }, [initialDepartment]);

  // Inside Dashboard2Client.tsx
  useEffect(() => {
    if (!selectedMoMDept && departmentList.length > 0) {
      const firstDept = departmentList[0];
      setSelectedMoMDept(firstDept);
      if (onDepartmentChange) onDepartmentChange(firstDept);
    }
  }, [departmentList, selectedMoMDept, onDepartmentChange]);
  // ✅ Department change handler for MoM tab
  const handleDepartmentSelect = (dept: string) => {
    setSelectedMoMDept(dept);
    if (onDepartmentChange) onDepartmentChange(dept);
  };

  const calculateRGM = (gross: number, total: number) =>
    total ? (gross / total) * 100 : 0;

  // ---------------- KPI Calculations ----------------
  const totalCurrent = useMemo(
    () =>
      items.reduce(
        (acc, d) => ({
          TotalAmount: acc.TotalAmount + (d.TotalAmount ?? 0),
          GrossMarginAmount: acc.GrossMarginAmount + (d.GrossMarginAmount ?? 0),
          TotalQty: acc.TotalQty + (d.TotalQty ?? 0),
          COGS: acc.COGS + (d.COGS ?? 0),
        }),
        { TotalAmount: 0, GrossMarginAmount: 0, TotalQty: 0, COGS: 0 },
      ),
    [items],
  );

  const totalLastMonth = useMemo(
    () =>
      items.reduce(
        (acc, d) => ({
          TotalAmount: acc.TotalAmount + (d.LastMonthTotalAmount ?? 0),
          GrossMarginAmount:
            acc.GrossMarginAmount + (d.LastMonthGrossMargin ?? 0),
          TotalQty: acc.TotalQty + (d.LastMonthTotalQty ?? 0),
        }),
        { TotalAmount: 0, GrossMarginAmount: 0, TotalQty: 0 },
      ),
    [items],
  );

  const totalLastYear = useMemo(
    () =>
      items.reduce(
        (acc, d) => ({
          TotalAmount: acc.TotalAmount + (d.LastYearTotalAmount ?? 0),
          GrossMarginAmount:
            acc.GrossMarginAmount + (d.LastYearGrossMargin ?? 0),
          TotalQty: acc.TotalQty + (d.LastYearTotalQty ?? 0),
        }),
        { TotalAmount: 0, GrossMarginAmount: 0, TotalQty: 0 },
      ),
    [items],
  );

  const RGMCurrent = calculateRGM(
    totalCurrent.GrossMarginAmount,
    totalCurrent.TotalAmount,
  );
  const RGMLastMonth = calculateRGM(
    totalLastMonth.GrossMarginAmount,
    totalLastMonth.TotalAmount,
  );
  const RGMLastYear = calculateRGM(
    totalLastYear.GrossMarginAmount,
    totalLastYear.TotalAmount,
  );

  const kpiCards = useMemo(
    () => [
      {
        title: "Total Amount",
        value: totalCurrent.TotalAmount,
        lastMonth: totalLastMonth.TotalAmount,
        lastYear: totalLastYear.TotalAmount,
      },
      {
        title: "Gross Margin",
        value: totalCurrent.GrossMarginAmount,
        lastMonth: totalLastMonth.GrossMarginAmount,
        lastYear: totalLastYear.GrossMarginAmount,
      },
      {
        title: "Margin %",
        value: RGMCurrent,
        lastMonth: RGMLastMonth,
        lastYear: RGMLastYear,
      },
      {
        title: "Total Qty",
        value: totalCurrent.TotalQty,
        lastMonth: totalLastMonth.TotalQty,
        lastYear: totalLastYear.TotalQty,
      },
    ],
    [
      totalCurrent,
      totalLastMonth,
      totalLastYear,
      RGMCurrent,
      RGMLastMonth,
      RGMLastYear,
    ],
  );

  // ---------------- Data Selection for Department/SubClass ----------------
  const dataToRender = useMemo(() => {
    if (!items || items.length === 0) return [];

    // ✅ If no department is selected, return all departments
    if (!selectedDepartment) {
      return items;
    }

    // ✅ If department selected, return only its SubClasses
    const deptData = items.find((d) => d.Department === selectedDepartment);
    return deptData?.SubClasses || [];
  }, [items, selectedDepartment]);

  const sortedData = useMemo(
    () =>
      [...dataToRender].sort(
        (a, b) => (b.TotalAmount ?? 0) - (a.TotalAmount ?? 0),
      ),
    [dataToRender],
  );

  // ---------------- Department/SubClass Table Function ----------------
  const renderDepartmentTable = (data: any[], isDepartment = false) => {
    const grandTotalRow = {
      Department: "Grand Total",
      SubClass: "Grand Total",
      TotalQty: totalCurrent.TotalQty,
      TotalAmount: totalCurrent.TotalAmount,
      COGS: totalCurrent.COGS,
      GrossMarginAmount: totalCurrent.GrossMarginAmount,
      LastMonthTotalQty: totalLastMonth.TotalQty,
      LastMonthTotalAmount: totalLastMonth.TotalAmount,
      LastMonthGrossMargin: totalLastMonth.GrossMarginAmount,
      LastYearTotalQty: totalLastYear.TotalQty,
      LastYearTotalAmount: totalLastYear.TotalAmount,
      LastYearGrossMargin: totalLastYear.GrossMarginAmount,
    };

    const finalData = [grandTotalRow, ...data];

    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full table-auto border-collapse text-sm">
          <thead className="sticky top-0 bg-gray-100 text-xs font-semibold uppercase text-gray-700">
            <tr>
              <th
                className="sticky left-0 z-50 border border-gray-300 bg-gray-100 px-4 py-2 text-left"
                rowSpan={2}
              >
                Department / SubClass
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-center"
                colSpan={5}
              >
                {startDate} - {endDate}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-center"
                colSpan={4}
              >
                Last Month
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-center"
                colSpan={4}
              >
                Last Year
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-center"
                rowSpan={2}
              >
                YoY
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-center"
                rowSpan={2}
              >
                MoM
              </th>
            </tr>
            <tr>
              {["Qty", "Amount (₹)", "COGS (₹)", "GM (₹)", "Margin (%)"].map(
                (t, i) => (
                  <th
                    key={`c${i}`}
                    className="border border-gray-300 bg-blue-50 px-4 py-2 text-right"
                  >
                    {t}
                  </th>
                ),
              )}
              {["Qty", "Amount (₹)", "GM (₹)", "Margin (%)"].map((t, i) => (
                <th
                  key={`lm${i}`}
                  className="border border-gray-300 bg-yellow-50 px-4 py-2 text-right"
                >
                  {t}
                </th>
              ))}
              {["Qty", "Amount (₹)", "GM (₹)", "Margin (%)"].map((t, i) => (
                <th
                  key={`ly${i}`}
                  className="border border-gray-300 bg-green-50 px-4 py-2 text-right"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {finalData.map((row: any, idx: number) => {
              const currentRGM = calculateRGM(
                row.GrossMarginAmount,
                row.TotalAmount,
              );
              const lastMonthRGM = calculateRGM(
                row.LastMonthGrossMargin,
                row.LastMonthTotalAmount,
              );
              const lastYearRGM = calculateRGM(
                row.LastYearGrossMargin,
                row.LastYearTotalAmount,
              );
              const YoY = row.LastYearTotalAmount
                ? ((row.TotalAmount - row.LastYearTotalAmount) /
                    row.LastYearTotalAmount) *
                  100
                : 0;
              const MoM = row.LastMonthTotalAmount
                ? ((row.TotalAmount - row.LastMonthTotalAmount) /
                    row.LastMonthTotalAmount) *
                  100
                : 0;

              const isGrandTotal = row.Department === "Grand Total";
              const rowBg = isGrandTotal
                ? "bg-orange-100 font-bold"
                : idx % 2 === 0
                  ? "bg-white"
                  : "bg-gray-50";

              return (
                <tr key={idx} className={`${rowBg} border-t border-gray-200`}>
                  <td
                    className={cn(
                      "sticky left-0 min-w-[200px] border border-gray-300 px-4 py-2 font-medium",
                      rowBg,
                    )}
                  >
                    {row.Department !== "Grand Total" && isDepartment ? (
                      <span
                        onClick={() => setSelectedDepartment(row.Department)}
                        className="inline-block cursor-pointer rounded px-3 py-1 font-semibold hover:bg-orange-200"
                      >
                        {row.Department}
                      </span>
                    ) : (
                      row.SubClass
                    )}
                  </td>

                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {standardFormat(row.TotalQty)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {standardFormat(row.TotalAmount)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {standardFormat(row.COGS)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {standardFormat(row.GrossMarginAmount)}
                  </td>
                  <td
                    className={cn(
                      "border border-gray-300 px-4 py-2 text-right font-semibold",
                      getRGMColor(currentRGM),
                    )}
                  >
                    {standardFormat(currentRGM)}%
                  </td>

                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {standardFormat(row.LastMonthTotalQty)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {standardFormat(row.LastMonthTotalAmount)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {standardFormat(row.LastMonthGrossMargin)}
                  </td>
                  <td
                    className={cn(
                      "border border-gray-300 px-4 py-2 text-right font-semibold",
                      getRGMColor(lastMonthRGM),
                    )}
                  >
                    {standardFormat(lastMonthRGM)}%
                  </td>

                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {standardFormat(row.LastYearTotalQty)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {standardFormat(row.LastYearTotalAmount)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {standardFormat(row.LastYearGrossMargin)}
                  </td>
                  <td
                    className={cn(
                      "border border-gray-300 px-4 py-2 text-right font-semibold",
                      getRGMColor(lastYearRGM),
                    )}
                  >
                    {standardFormat(lastYearRGM)}%
                  </td>

                  <td
                    className={cn(
                      "border border-gray-300 px-4 py-2 text-right font-semibold",
                      getRGMColor(YoY),
                    )}
                  >
                    {standardFormat(YoY)}%
                  </td>
                  <td
                    className={cn(
                      "border border-gray-300 px-4 py-2 text-right font-semibold",
                      getRGMColor(MoM),
                    )}
                  >
                    {standardFormat(MoM)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ------------------- Loading State -------------------
  if (status === "loading") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="loader h-16 w-16 rounded-full border-8 border-t-8 border-gray-200 ease-linear"></div>
      </div>
    );
  }

  // ------------------- Main Render -------------------
  return (
    <>
      {toggleValue === 0 ? (
        <div className="space-y-6 p-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => {
              const MoM = kpi.lastMonth
                ? ((kpi.value - kpi.lastMonth) / kpi.lastMonth) * 100
                : 0;
              const YoY = kpi.lastYear
                ? ((kpi.value - kpi.lastYear) / kpi.lastYear) * 100
                : 0;
              return (
                <div
                  key={kpi.title}
                  className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow transition-all hover:shadow-lg"
                >
                  <div className="text-sm font-semibold text-gray-500">
                    {kpi.title}
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {kpi.title === "Margin %"
                      ? `${standardFormat(kpi.value)}%`
                      : `₹ ${standardFormat(kpi.value)}`}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>MoM</span>
                    <span className={getRGMColor(MoM)}>
                      {standardFormat(MoM)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>YoY</span>
                    <span className={getRGMColor(YoY)}>
                      {standardFormat(YoY)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <MixBarChart
            data={sortedData.map((d) => ({
              name: d.Department ?? d.SubClass,
              Current: d.TotalAmount ?? 0,
              LastMonth: d.LastMonthTotalAmount ?? 0,
              LastYear: d.LastYearTotalAmount ?? 0,
              Margin: d.TotalAmount
                ? ((d.GrossMarginAmount ?? 0) / d.TotalAmount) * 100
                : 0,
            }))}
            height={300}
          />

          {/* Department Table */}
          <div className="overflow-x-auto rounded-lg bg-white shadow-lg">
            {selectedDepartment && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 font-semibold text-white shadow-sm">
                  <span>{selectedDepartment}</span>
                  <button
                    onClick={() => {
                      setSelectedDepartment(null), setHasUserCleared(true);
                    }}
                    className="rounded-full p-1 hover:bg-orange-400"
                  >
                    <AiOutlineClose className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            {renderDepartmentTable(sortedData, !selectedDepartment)}
          </div>
        </div>
      ) : (
        <div className="space-y-6 p-4">
          {/* ===== Department Selector ===== */}
          <div className="mb-4 flex items-center gap-2">
            <label className="font-semibold text-gray-700">
              Select Department:
            </label>

            <select
              value={selectedMoMDept || ""}
              onChange={(e) => handleDepartmentSelect(e.target.value)}
              className="rounded-md border px-3 py-2"
            >
              <option value="">Select Department</option>

              {departmentList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* ===== MoM Table ===== */}
          <div className="relative flex max-h-[85vh] flex-col rounded-2xl border border-gray-200 bg-white shadow-xl">
            {/* ===== FIXED HEADER BAR ===== */}
            <div className="sticky top-0 flex items-center justify-between border-b bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800">
                Department: {selectedMoMDept || "—"}
              </h2>

              <div className="flex items-center gap-3">
                {currentPage > 1 && (
                  <button
                    onClick={() =>
                      onPreviousPage && onPreviousPage(selectedMoMDept)
                    }
                    className="rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-400"
                  >
                    ← Previous
                  </button>
                )}

                <button
                  onClick={() => onNextPage && onNextPage(selectedMoMDept)}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* ===== SCROLLABLE TABLE AREA ===== */}
            <div className="flex-1 overflow-auto">
              {selectedMoMDept && momData.length > 0 ? (
                (() => {
                  const months = momData.map((m) => formatMonthName(m.Month));

                  const brandMap = {};

                  momData.forEach((month) => {
                    const monthName = formatMonthName(month.Month);

                    const dept = (month.Departments || []).find(
                      (d) => d.Department === selectedMoMDept,
                    );

                    (dept?.Brands || []).forEach((brand) => {
                      const name =
                        brand?.BrandName?.trim() ||
                        brand?.Brand?.trim() ||
                        brand?.Brand_Name?.trim() ||
                        brand?.BrandDescription?.trim() ||
                        "(No Name)";

                      const sale = brand?.GrossAmount ?? 0;
                      const cogs = brand?.COGS ?? 0;
                      const margin =
                        sale > 0 ? ((sale - cogs) / sale) * 100 : 0;

                      if (!brandMap[name]) brandMap[name] = {};
                      brandMap[name][monthName] = { sale, margin };
                    });
                  });

                  return (
                    <div className="w-full overflow-auto rounded-lg border border-gray-200 shadow-sm">
                      <table className="w-full border-collapse text-sm text-gray-800">
                        {/* ===== HEADER ===== */}
                        <thead className="sticky top-0 z-40 bg-gray-100 shadow-sm">
                          <tr>
                            <th className="sticky left-0 z-50 whitespace-nowrap border-b border-gray-200 bg-gray-100 px-2 py-2 text-left font-semibold">
                              Brand
                            </th>

                            <th
                              colSpan={months.length}
                              className="whitespace-nowrap border-b border-gray-200 bg-gray-100 px-2 py-2 text-center font-semibold"
                            >
                              Sale (₹)
                            </th>

                            <th
                              colSpan={months.length}
                              className="whitespace-nowrap border-b border-gray-200 bg-gray-100 px-2 py-2 text-center font-semibold"
                            >
                              Margin %
                            </th>
                          </tr>

                          <tr className="bg-gray-50 text-gray-600">
                            <th className="sticky left-0 z-50 border-b bg-gray-50 px-2 py-2"></th>

                            {months.map((monthName, i) => (
                              <th
                                key={`sale-header-${monthName}-${i}`}
                                className="whitespace-nowrap border-b px-2 py-2 text-center font-medium"
                              >
                                {monthName}
                              </th>
                            ))}

                            {months.map((monthName, i) => (
                              <th
                                key={`margin-header-${monthName}-${i}`}
                                className="whitespace-nowrap border-b px-2 py-2 text-center font-medium"
                              >
                                {monthName}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        {/* ===== BODY ===== */}
                        <tbody>
                          {Object.entries(brandMap).map(
                            ([brandName, monthData], idx) => (
                              <tr
                                key={brandName}
                                className={`border-b transition-colors ${
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                } hover:bg-blue-50`}
                              >
                                <td className="sticky left-0 z-10 whitespace-nowrap border-r bg-inherit px-2 py-2 font-medium text-gray-900">
                                  {brandName}
                                </td>

                                {months.map((monthName, i) => (
                                  <td
                                    key={`sale-${brandName}-${monthName}-${i}`}
                                    className="whitespace-nowrap px-2 py-2 text-right font-semibold text-gray-900"
                                  >
                                    ₹{" "}
                                    {standardFormat(
                                      monthData[monthName]?.sale ?? 0,
                                    )}
                                  </td>
                                ))}

                                {months.map((monthName, i) => (
                                  <td
                                    key={`margin-${brandName}-${monthName}-${i}`}
                                    className={cn(
                                      "whitespace-nowrap px-2 py-2 text-center font-semibold",
                                      getRGMColor(
                                        monthData[monthName]?.margin ?? 0,
                                      ),
                                    )}
                                  >
                                    {standardFormat(
                                      monthData[monthName]?.margin ?? 0,
                                    )}
                                    %
                                  </td>
                                ))}
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-gray-500">
                  No data found for this department.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
