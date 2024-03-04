import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import productSlice from "./slices/productSlice";
import paginationSlice from "./slices/paginationSlice";
import brandsSlice from "./slices/brandsSlice";
import priceSlice from "./slices/priceSlice";

export const store = configureStore({
  reducer: {
    products: productSlice,
    pagination: paginationSlice,
    brands: brandsSlice,
    price: priceSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Отключить проверку сериализации
    }),
});
