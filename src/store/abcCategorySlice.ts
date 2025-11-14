// store/abcCategorySlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface ABCItem {
  ProductCode: number;
  ProductName: string;
  Department: string;
  Class: string;
  BrandName: string;
  SalePercent: number;
  CumulativePercent: number;
  Sale3Months: number;
  SaleQty: number;
  StockQty: number;
  DaysLeft: number;
  ABC_Category: "A" | "B" | "C" | string;
}

interface CategorySummary {
  total_skus: number;
  in_stock: number;
  out_of_stock: number;
  in_stock_ratio_pct: number;
  out_of_stock_ratio_pct: number;
}

interface ABCState {
  abcData: ABCItem[];
  page: number;
  limit: number;
  total_count: number;
  totalPages: number;
  category_summary: {
    A: CategorySummary;
    B: CategorySummary;
    C: CategorySummary;
  } | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ABCState = {
  abcData: [],
  page: 1,
  limit: 20,
  total_count: 0,
  totalPages: 1,
  category_summary: null,
  status: "idle",
  error: null,
};

export const fetchABCReport = createAsyncThunk(
  "categoryClassification/fetchABCReport",
  async (body: any, { rejectWithValue }) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/debug/abc-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to fetch");
      }
      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

const abcCategorySlice = createSlice({
  name: "categoryClassification",
  initialState,
  reducers: {
    clearABC: (state) => {
      state.abcData = [];
      state.page = 1;
      state.limit = 20;
      state.total_count = 0;
      state.totalPages = 1;
      state.category_summary = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchABCReport.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchABCReport.fulfilled, (state, action) => {
        const payload = action.payload || {};
        state.status = "succeeded";
        state.abcData = payload.ABCData || [];
        state.page = payload.page || 1;
        state.limit = payload.limit || state.limit;
        state.total_count = payload.total_count || 0;
        state.totalPages = payload.total_pages || payload.totalPages || Math.ceil((payload.total_count || 0) / (payload.limit || state.limit || 1));
        state.category_summary = payload.category_summary || null;
      })
      .addCase(fetchABCReport.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string || action.error.message || "Failed to fetch";
      });
  },
});

export const { clearABC } = abcCategorySlice.actions;
export default abcCategorySlice.reducer;
