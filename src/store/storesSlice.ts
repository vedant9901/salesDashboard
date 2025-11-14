import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// 1️⃣ Define the type for a single store item (adjust fields if known)
export interface StoreItem {
  [key: string]: any; // can replace with explicit fields, e.g., id: number; name: string
}

// 2️⃣ Define the slice state type
interface StoresState {
  items: StoreItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// 3️⃣ Initial state
const initialState: StoresState = {
  items: [],
  status: 'idle',
  error: null,
};

// 4️⃣ Async thunk to fetch stores from Flask API
export const fetchStores = createAsyncThunk<StoreItem[]>(
  'stores/fetchStores',
  async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stores/stores`);
    if (!res.ok) throw new Error('Failed to fetch stores');
    return (await res.json()) as StoreItem[];
  }
);

// 5️⃣ Create slice
const storesSlice = createSlice({
  name: 'stores',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStores.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStores.fulfilled, (state, action: PayloadAction<StoreItem[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Something went wrong';
      });
  },
});

export default storesSlice.reducer;
