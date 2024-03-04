import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedBrands: "",
  availableBrands: [],
};

const brandsSlice = createSlice({
  name: "brands",
  initialState,
  reducers: {
    setSelectedBrands(state, action) {
      state.selectedBrands = action.payload;
    },
    setAvailableBrands(state, action) {
      state.availableBrands = action.payload;
    },
  },
});

export const { setSelectedBrands, setAvailableBrands } = brandsSlice.actions;
export default brandsSlice.reducer;
