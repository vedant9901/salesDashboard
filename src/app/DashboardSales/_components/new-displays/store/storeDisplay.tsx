'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { fetchStores } from '@/store/storesSlice';
import { fetchDashboardSales } from '@/store/dashboardSlice';

export default function StoresPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { items: stores, status: storesStatus, error: storesError } =
    useSelector((state: RootState) => state.stores);
  const { SalesItems: sales, status: salesStatus, error: salesError } =
    useSelector((state: RootState) => state.sales);

  useEffect(() => {
    dispatch(fetchStores());
    dispatch(fetchDashboardSales());
  }, []);

  // --- compute net SC amount per store ---
  const netStoreAmounts = sales.reduce<Record<number, number>>((acc, sale) => {
    const { StoreCode, BillSeries, Amount } = sale;
    if (!acc[StoreCode]) acc[StoreCode] = 0;

    if (BillSeries === 'SC') acc[StoreCode] += Amount;
    if (BillSeries === 'LSR') acc[StoreCode] -= Amount; // subtract LSR
    return acc;
  }, {});

  return (
    <div style={{ padding: 20 }}>
      <h1>Stores</h1>

      {(storesStatus === 'loading' || salesStatus === 'loading') && <p>Loading…</p>}
      {(storesStatus === 'failed' || salesStatus === 'failed') && (
        <p style={{ color: 'red' }}>{storesError || salesError}</p>
      )}

      {(storesStatus === 'succeeded' && salesStatus === 'succeeded') && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {stores.map((store) => {
            const netAmount = netStoreAmounts[store.StoreCode] || 0;
            return (
              <div
                key={store.StoreCode}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: 16,
                  width: 250,
                  boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
                }}
              >
                <h3>{store.StoreName}</h3>
                <p><strong>Store Code:</strong> {store.StoreCode}</p>
                <p><strong>Region:</strong> {store.RegionName}</p>
                <p><strong>Net SC Amount:</strong> ₹{netAmount.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
