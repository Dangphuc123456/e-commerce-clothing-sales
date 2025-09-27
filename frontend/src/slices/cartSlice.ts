import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../api/axios";

export interface CartItem {
  id?: number;
  userId: number;
  productName: string;
  variantId: number;
  sku?: string;
  size?: string;
  color?: string;
  image?: string;
  price: number;
  discounted_price?: number | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCart = createAsyncThunk("cart/fetchCart", async () => {
  const userId = localStorage.getItem("userId");
  const res = await api.get(`/api/customer/cart/${userId}`);
  return res.data as CartItem[];
});


export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (item: CartItem) => {
    const res = await api.post("/api/customer/cart/add", item);
    return res.data as CartItem;
  }
);

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (payload: { variantId: number }) => {
    const userId = localStorage.getItem("userId");
    await api.delete(`/api/customer/cart/remove/${userId}/${payload.variantId}`);
    return payload;
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async (payload: { variantId: number; quantity: number }) => {
    const userId = Number(localStorage.getItem("userId"));
    await api.put("/api/customer/cart/update", {
      user_id: userId,
      variantId: payload.variantId,
      quantity: payload.quantity,
    });
    return payload;
  }
);


const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch cart";
      })

      .addCase(addToCart.fulfilled, (state, action: PayloadAction<CartItem>) => {
        const existing = state.items.find(i => i.variantId === action.payload.variantId);

        if (existing) {
          existing.quantity += action.payload.quantity;
        } else {
          state.items.push(action.payload);
        }
      })


      .addCase(removeFromCart.fulfilled, (state, action: PayloadAction<{ variantId: number }>) => {
        state.items = state.items.filter(i => i.variantId !== action.payload.variantId);
      })

      .addCase(updateCartItem.fulfilled, (state, action: PayloadAction<{ variantId: number; quantity: number }>) => {
        const item = state.items.find(i => i.variantId === action.payload.variantId);
        if (item) {
          item.quantity = action.payload.quantity;
        }
      });

  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
