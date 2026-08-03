import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    isInitialized: false,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isInitialized = true;
      sessionStorage.setItem('accessToken', action.payload.token);
      sessionStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
    },
    loadUser: (state) => {
      // Clean up old localStorage items from previous versions
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }

      const token = sessionStorage.getItem('accessToken');
      const user = sessionStorage.getItem('user');
      if (token && user) {
        state.token = token;
        state.user = JSON.parse(user);
        state.isAuthenticated = true;
      }
      state.isInitialized = true;
    },
  },
});

export const { loginSuccess, logout, loadUser } = authSlice.actions;
export default authSlice.reducer;