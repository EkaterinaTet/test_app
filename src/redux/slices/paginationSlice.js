import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentPage: 1,
  startPage: 1,
  showPagination: true,
};

const paginationSlice = createSlice({
  name: "pagination",
  initialState,
  reducers: {
    setCurrentPage(state, action) {
      state.currentPage = action.payload;
    },
    setStartPage(state, action) {
      state.startPage = action.payload;
    },
    setShowPagination(state, action) {
      state.showPagination = action.payload;
    },
  },
});

export const { setCurrentPage, setStartPage, setShowPagination } =
  paginationSlice.actions;
export default paginationSlice.reducer;
