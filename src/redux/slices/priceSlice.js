import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  valuePrice: "",
  availablePrices: [], // доступные цены
};

const priceSlice = createSlice({
  name: "price",
  initialState,
  reducers: {
    setValuePrice(state, action) {
      state.valuePrice = action.payload;
    },
    setAvailablePrices(state, action) {
      state.availablePrices = action.payload;
    },
  },
});

export const { setValuePrice, setAvailablePrices } = priceSlice.actions;
export default priceSlice.reducer;
