import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../features/counter/counterSlice'
import accountReducer from '../features/account/accountSlice'
import eventReducer from '../features/events/eventSlice'
import purchaseReducer from '../features/purchase/purchaseSlice'
import styleReducer from '../features/style/styleSlice'

export default configureStore({
  reducer: {
  	counter: counterReducer,
  	account: accountReducer,
  	events: eventReducer,
    purchase: purchaseReducer,
    style: styleReducer,
  }
})