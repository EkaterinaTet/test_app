import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  allProducts: [],
  filteredProductsName: [],
  loading: false,
  searchQuery: "",
};
export const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    setAllProducts: (state, action) => {
      state.allProducts = action.payload;
    },
    setFilteredProductsName: (state, action) => {
      state.filteredProductsName = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
  },
});

export const {
  setProducts,
  setAllProducts,
  setFilteredProductsName,
  setLoading,
  setSearchQuery,
} = productSlice.actions;
export default productSlice.reducer;
