// store/marginReportSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface MoMBrandItem {
  Brand: string;
  TotalAmount: number;
  COGS: number;
  TotalQty: number;
  GrossAmount: number;
  GrossMarginAmount: number;
  RGM: number;
}

export interface MoMDepartmentItem {
  Department: string;
  TotalQty: number;
  TotalAmount: number;
  COGS: number;
  GrossAmount: number;
  GrossMarginAmount: number;
  RGM: number;
  Brands: MoMBrandItem[];
}

export interface MoMItem {
  Month: string;
  Departments: MoMDepartmentItem[];
}

export interface MarginReportItem {
  Department: string;
  TotalQty: number;
  TotalAmount: number;
  COGS: number;
  GrossAmount: number;
  GrossMarginAmount: number;
  RGM: number;

  /** Last Month */
  LastMonthTotalQty?: number;
  LastMonthTotalAmount?: number;
  LastMonthGrossMargin?: number;

  /** Last Year */
  LastYearTotalQty?: number;
  LastYearTotalAmount?: number;
  LastYearGrossMargin?: number;

  /** Subclasses (if present) */
  SubClasses?: MarginReportItem[];
}


export interface MarginReportState {
  items: MarginReportItem[];
  momData: MoMItem[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  grandTotal: {
    TotalQty: number;
    TotalAmount: number;
    COGS: number;
    GrossAmount: number;
    GrossMarginAmount: number;
    RGM: number;
  };
}

const initialState: MarginReportState = {
  items: [],
  momData: [],
  status: "idle",
  error: null,
  grandTotal: {
    TotalQty: 0,
    TotalAmount: 0,
    COGS: 0,
    GrossAmount: 0,
    GrossMarginAmount: 0,
    RGM: 0,
  },
};

// --- Async thunk: fetch department sales ---
export const fetchMarginReport = createAsyncThunk(
  "marginReport/fetch",
  async (
    params: { storeCodes?: number[]; startDate: string; endDate: string },
    { getState }
  ) => {
    const state: any = getState();
    const allStores: number[] = Object.keys(state.stores.items || {}).map(Number);
    const storeCodesToSend =
      !params.storeCodes || params.storeCodes.length === 0
        ? allStores.filter((code) => code !== 30 && code !== 62)
        : params.storeCodes;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/margin/department-sales-margin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeCodes: storeCodesToSend,
        startDate: params.startDate,
        endDate: params.endDate,
      }),
    });

    if (!res.ok) throw new Error("Failed to fetch margin report");
    const data = await res.json();

    return {
      items: Array.isArray(data.Departments) ? data.Departments : [],
      grandTotal: data.GrandTotal || initialState.grandTotal,
    };
  }
);

// --- Async thunk: fetch Month-on-Month data (Department + Brand, Paginated) ---
// --- Async thunk: fetch Month-on-Month data (Department + Brand, Paginated) ---
export const fetchMoMReport = createAsyncThunk(
  "marginReport/fetchMoM",
  async (
    params: {
      storeCodes?: number[];
      startDate: string;
      endDate: string;
      department?: string;
      page?: number;
      limit?: number;
    },
    { getState }
  ) => {
    const state: any = getState();
    const allStores: number[] = Object.keys(state.stores.items || {}).map(Number);
    const storeCodesToSend =
      !params.storeCodes || params.storeCodes.length === 0
        ? allStores.filter((code) => code !== 30 && code !== 62)
        : params.storeCodes;

    // ✅ include pagination + department filters
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/margin/mom-sales-margin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeCodes: storeCodesToSend,
        startDate: params.startDate,
        endDate: params.endDate,
        department: params.department || null,
        page: params.page || 1,
        limit: params.limit || 50,
      }),
    });

    if (!res.ok) throw new Error("Failed to fetch MoM data");
    const data = await res.json();

    // ✅ Normalize data safely
    const momData: MoMItem[] = Array.isArray(data.MoMData)
      ? data.MoMData.map((monthItem: any) => ({
          Month: monthItem.Month || "",
          Departments: Array.isArray(monthItem.Departments)
            ? monthItem.Departments.map((dept: any) => ({
                Department: dept.Department || "",
                TotalQty: dept.TotalQty || 0,
                TotalAmount: dept.TotalAmount || 0,
                COGS: dept.COGS || 0,
                GrossAmount: dept.GrossAmount || 0,
                GrossMarginAmount: dept.GrossMarginAmount || 0,
                RGM: dept.RGM || 0,
                Brands: Array.isArray(dept.Brands)
                  ? dept.Brands.map((brand: any) => ({
                      BrandCode: brand.BrandCode || null,
                      Brand:
                        brand.BrandName?.trim() ||
                        brand.BrandDescription?.trim() ||
                        brand.Brand ||
                        "(No Brand)",
                      TotalQty: brand.TotalQty || 0,
                      TotalAmount: brand.TotalAmount || 0,
                      GrossAmount: brand.GrossAmount || 0,
                      COGS: brand.COGS || 0,
                      GrossMarginAmount: brand.GrossMarginAmount || 0,
                      RGM: brand.RGM || 0,
                    }))
                  : [],
              }))
            : [],
        }))
      : [];

    // ✅ include pagination & department info if present
    return {
      MoMData: momData,
      SelectedDepartment: data.SelectedDepartment || params.department || "",
      Departments: Array.isArray(data.Departments) ? data.Departments : [],
      Page: data.Page || 1,
      Limit: data.Limit || 50,
      TotalBrands: data.TotalBrands || 0,
    };
  }
);


export const marginReportSlice = createSlice({
  name: "marginReport",
  initialState,
  reducers: {
    clearMarginReport: (state) => {
      state.items = [];
      state.momData = [];
      state.status = "idle";
      state.error = null;
      state.grandTotal = initialState.grandTotal;
    },
  },
  extraReducers: (builder) => {
    builder
      // Department sales
      .addCase(fetchMarginReport.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMarginReport.fulfilled, (state, action: PayloadAction<{ items: MarginReportItem[]; grandTotal: MarginReportState["grandTotal"] }>) => {
        state.status = "succeeded";
        state.items = action.payload.items;
        state.grandTotal = action.payload.grandTotal;
      })
      .addCase(fetchMarginReport.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch margin report";
      })

      // MoM report
      .addCase(fetchMoMReport.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchMoMReport.fulfilled,
        (
          state,
          action: PayloadAction<{
            MoMData: MoMItem[];
            SelectedDepartment: string;
            Departments: string[];
            Page: number;
            Limit: number;
            TotalBrands: number;
          }>
        ) => {
          state.status = "succeeded";
          state.momData = action.payload.MoMData;
          // You can later expose pagination info to UI if needed
        }
      )
      .addCase(fetchMoMReport.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch MoM data";
      });
  },
});

export const { clearMarginReport } = marginReportSlice.actions;
export default marginReportSlice.reducer;
