import { createSlice } from '@reduxjs/toolkit'

export const eventSlice = createSlice({
  name: 'events',
  initialState: {
    all_events: {},
  },
  reducers: {
    setEvents: (state, action) => {
      // state.all_events = action.payload
      for (const data of action.payload) {
        state.all_events[data["event_id"]] = data
      }
    },
    updateAllEvents: (state, action) => {
      // state.all_events = action.payload
      for (const data of action.payload) {
        if (!Object.keys(state.all_events).includes(data["event_id"])) {
          state.all_events[data["event_id"]] = data
        }
      }
    },
    resetEvents: (state) => {
      state.all_events = {}
    },
  }
})

// Action creators are generated for each case reducer function
export const { 
  setEvents,
  updateAllEvents,
  resetEvents,
} = eventSlice.actions

export default eventSlice.reducer