import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";

interface SecurityState {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  session: any | null;
}

const initialState: SecurityState = {
  status: "idle",
  error: null,
  session: null,
};

// Async thunk for login
export const loginUser = createAsyncThunk(
  "security/loginUser",
  async (credentials: { email: string; password: string }) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include", // important for cookies
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }

    const data = await res.json();
    return data; // ✅ this is returned to the page via .unwrap()
  }
);

const securitySlice = createSlice({
  name: "security",
  initialState,
  reducers: {
    logout: (state) => {
      state.session = null;
      state.status = "idle";
      state.error = null;
    },
    setSession: (state, action) => {
      state.session = action.payload;
      state.status = "succeeded";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.session = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Login failed";
      });
  },
});

export const { logout, setSession } = securitySlice.actions;
export default securitySlice.reducer;
export const selectSecurity = (state: RootState) => state.security;
