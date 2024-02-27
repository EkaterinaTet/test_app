import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  id: 1,
  brand: "Sofa",
  name: "S",
  price: 20,
};
export const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setProducts: (state, action) => {},
  },
});

export const {} = productSlice.actions;
export default productSlice.reducer;
