// put this in your Redux slice folder

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SelectedStoreState {
  code: number | 'all';
  name: string;
}

const initialState: SelectedStoreState = { code: 'all', name: 'All Stores' };

const selectedStoreSlice = createSlice({
  name: 'selectedStore',
  initialState,
  reducers: {
    setSelectedStore(state, action: PayloadAction<SelectedStoreState>) {
      state.code = action.payload.code;
      state.name = action.payload.name;
    },
  },
});

export const { setSelectedStore } = selectedStoreSlice.actions;
export default selectedStoreSlice.reducer;
