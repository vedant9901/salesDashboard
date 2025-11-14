import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { applyMultiMerge, normalizeSales } from '@/lib/utils';   // 👈 import your helpers

// -------------------- Types --------------------
export interface SalesItem { [key: string]: any; }
export interface StoreTarget { StoreCode: number; Target: number; }
export interface OverallSalesItem { [key: string]: any; }

interface SalesState {
  SalesItems: SalesItem[];
  OverallSalesItems: OverallSalesItem[];
  StoreTargets: StoreTarget[];
  LMMTDSales: OverallSalesItem[];
  LYSalesItems: OverallSalesItem[]; // Last Year
  lmStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  lyStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  targetStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  targetError: string | null;
}

// -------------------- Initial state --------------------
const initialState: SalesState = {
  SalesItems: [],
  OverallSalesItems: [],
  StoreTargets: [],
  LMMTDSales: [],
  LYSalesItems: [],
  lmStatus: 'idle',
  lyStatus: 'idle',
  status: 'idle',
  targetStatus: 'idle',
  error: null,
  targetError: null,
};

// -------------------- Async thunks --------------------
export const fetchDashboardSales = createAsyncThunk<SalesItem[]>(
  'sales/fetchDashboardSales',
  async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/yest-sales`);
    if (!res.ok) throw new Error('Failed to fetch Sales');
    return (await res.json()) as SalesItem[];
  }
);

export const fetchStoreTargets = createAsyncThunk<StoreTarget[]>(
  'sales/fetchStoreTargets',
  async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/store-target`);
    if (!res.ok) throw new Error('Failed to fetch Store Targets');
    return (await res.json()) as StoreTarget[];
  }
);

export const fetchOverallSales = createAsyncThunk<
  OverallSalesItem[],
  { startDate: string; endDate: string }
>(
  'sales/fetchOverallSales',
  async ({ startDate, endDate }) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/sales/transactions?startDate=${startDate}&endDate=${endDate}`
    );
    if (!res.ok) throw new Error('Failed to fetch Sales');
    return (await res.json()) as OverallSalesItem[];
  }
);

export const fetchLMMTDSales = createAsyncThunk<
  OverallSalesItem[],
  { startDate: string; endDate: string }
>(
  'sales/fetchLMMTDSales',
  async ({ startDate, endDate }) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/lm-transactions?startDate=${startDate}&endDate=${endDate}`);
    if (!res.ok) throw new Error('Failed to fetch LM MTD Sales');
    return (await res.json()) as OverallSalesItem[];
  }
);

export const fetchLYSales = createAsyncThunk<
  OverallSalesItem[],
  { startDate: string; endDate: string }
>(
  'sales/fetchLYSales',
  async ({ startDate, endDate }) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/ly-transactions?startDate=${startDate}&endDate=${endDate}`);
    if (!res.ok) throw new Error('Failed to fetch Last Year Sales');
    return (await res.json()) as OverallSalesItem[];
  }
);

// -------------------- Slice --------------------
const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ----------------- Yesterday Sales -----------------
      .addCase(fetchDashboardSales.fulfilled, (state, action: PayloadAction<SalesItem[]>) => {
        state.status = 'succeeded';
        const normalized = normalizeSales(action.payload);
        state.SalesItems = applyMultiMerge(normalized, [
          [35, 8],
          // [62, 30],
        ]);
      })
      .addCase(fetchDashboardSales.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchDashboardSales.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Something went wrong';
      })

      // ----------------- Overall Sales -----------------
      .addCase(fetchOverallSales.fulfilled, (state, action: PayloadAction<OverallSalesItem[]>) => {
        state.status = 'succeeded';
        const normalized = normalizeSales(action.payload);
        state.OverallSalesItems = applyMultiMerge(normalized, [
          [35, 8],
          // [62, 30],
        ]);
      })
      .addCase(fetchOverallSales.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchOverallSales.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Something went wrong';
      })

      // ----------------- Store Targets -----------------
      .addCase(fetchStoreTargets.fulfilled, (state, action: PayloadAction<StoreTarget[]>) => {
        state.targetStatus = 'succeeded';
        state.StoreTargets = action.payload;
      })
      .addCase(fetchStoreTargets.pending, (state) => { state.targetStatus = 'loading'; })
      .addCase(fetchStoreTargets.rejected, (state, action) => {
        state.targetStatus = 'failed';
        state.targetError = action.error.message ?? 'Something went wrong';
      })

      // ----------------- LM MTD Sales -----------------
      .addCase(fetchLMMTDSales.fulfilled, (state, action: PayloadAction<OverallSalesItem[]>) => {
        state.lmStatus = 'succeeded';
        const normalized = normalizeSales(action.payload);
        state.LMMTDSales = applyMultiMerge(normalized, [
          [35, 8],
          // [62, 30],
        ]);
      })
      .addCase(fetchLMMTDSales.pending, (state) => { state.lmStatus = 'loading'; })
      .addCase(fetchLMMTDSales.rejected, (state, action) => {
        state.lmStatus = 'failed';
        state.error = action.error.message ?? 'Something went wrong fetching LM MTD Sales';
      })

      // ----------------- Last Year Sales -----------------
      .addCase(fetchLYSales.fulfilled, (state, action: PayloadAction<OverallSalesItem[]>) => {
        state.lyStatus = 'succeeded';
        const normalized = normalizeSales(action.payload);
        state.LYSalesItems = applyMultiMerge(normalized, [
          [35, 8],
          // [62, 30],
        ]);
      })
      .addCase(fetchLYSales.pending, (state) => { state.lyStatus = 'loading'; })
      .addCase(fetchLYSales.rejected, (state, action) => {
        state.lyStatus = 'failed';
        state.error = action.error.message ?? 'Something went wrong fetching Last Year Sales';
      });
  },
});

export default salesSlice.reducer;
