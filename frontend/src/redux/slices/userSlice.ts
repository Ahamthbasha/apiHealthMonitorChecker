import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type UserSlice } from "./interface/IUserSlice";

const initialState: UserSlice = {
  userId: null,
  name: null,
  email: null,
  role: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{
        _id: string;
        name: string;
        email: string;
        role: string;
      }>
    ) => {
      const { _id, name,email, role } =
        action.payload;

      state.userId = _id;
      state.name = name
      state.email = email;
      state.role = role;

      localStorage.setItem("user", JSON.stringify(state));
    },

    clearUserDetails: (state) => {
      state.userId = null;
      state.name = null
      state.email = null;
      state.role = null;
      localStorage.removeItem("user");
    },
  },
});

export const { setUser, clearUserDetails } = userSlice.actions;
export default userSlice.reducer;
