import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice.jsx"; // Ensure this path and extension match your project

const store = configureStore({
  reducer: {
    auth: authReducer, // This key must be "auth"
  },
});

export default store;