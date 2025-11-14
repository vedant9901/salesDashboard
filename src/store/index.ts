import { configureStore } from '@reduxjs/toolkit'
import storesReducer from './storesSlice'
import salesReducer from './dashboardSlice'
import selectedStoreReducer from './selectedStoreSlice';
import securityReducer from "./security";
// 👇 import the slice you just created
import marginReportReducer from './marginReportSlice'
import CategoryClassificationReducer from './abcCategorySlice'

export const store = configureStore({
  reducer: {
    stores: storesReducer,
    sales: salesReducer, // add the sales slice here
    selectedStore: selectedStoreReducer,
    security: securityReducer,
    marginReport: marginReportReducer,
    categoryClassification: CategoryClassificationReducer,
  },
})

// ✅ Export types for use in components
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
