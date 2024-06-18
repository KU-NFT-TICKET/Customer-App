import { createSlice } from '@reduxjs/toolkit'

export const styleSlice = createSlice({
  name: 'style',
  initialState: {
    loading_size_profile: {
      height: '30px',
      width: '50px',
      margin: 'auto',
    },
  },
  reducers: {
  }
})

// Action creators are generated for each case reducer function
export const { 
} = styleSlice.actions

export default styleSlice.reducer