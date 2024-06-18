import { createSlice } from '@reduxjs/toolkit'
import { is_ticket_available } from '../function'
import { BigNumber,ethers } from 'ethers'

export const purchaseSlice = createSlice({
  name: 'purchase',
  initialState: {
    purchaseState: 1,   // 1 = select seats, 2 = purchase detail/confirm, 3 = buy result/order detail
    seatSelection: [],
    seat2ndSelection: [],
    marketplace_prices: {},
    order_id: "",
    selected_seat_row: "",
    selected_zone: "",
    min_selected_seatID: "",
    max_selected_seatID: "",
    zoneAvailability: {},
    seatDetail: {},
    eventDetail: {},
    event_id: null,
    single_price: "0",
    single_gas_fee: "0",
    single_2nd_gas_fee: "0",
    purchase_results: {},
  },
  reducers: {
    addSeatSelection: (state, action) => {
      let seat_detail = {}
      let seleted_zone = ""
      for (const zone_name of Object.keys(state.seatDetail)) {
        if (action.payload in state.seatDetail[zone_name]) {
          seat_detail = state.seatDetail[zone_name][action.payload]
          seleted_zone = zone_name
          break
        }
      }
      if (Object.keys(seat_detail).length > 0) {
        if (state.seatSelection.length === 0) {
          state.min_selected_seatID = seat_detail["seat_id"]
          state.max_selected_seatID = seat_detail["seat_id"]
          state.single_price = BigNumber.from(seat_detail["price"])._hex
        } else if (seat_detail["seat_id"] < state.min_selected_seatID) {
          state.min_selected_seatID = seat_detail["seat_id"]
        } else if (seat_detail["seat_id"] > state.max_selected_seatID) {
          state.max_selected_seatID = seat_detail["seat_id"]
        } else {
          throw new Error('Invalid [ticket_id] to add. (input: ' + action.payload + ')');
        }
        state.selected_seat_row = seat_detail["seat_row"]
        state.selected_zone = seleted_zone
        state.seatSelection.push(action.payload)
      } else {
        throw new Error('Invalid [ticket_id]. cannot find [ticket_id] in [state.seatDetail].');
      }
    },
    removeSeatSelection: (state, action) => {
      let seat_detail = {}
      for (const zone_name of Object.keys(state.seatDetail)) {
        if (action.payload in state.seatDetail[zone_name]) {
          seat_detail = state.seatDetail[zone_name][action.payload]
          break
        }
      }
      if (Object.keys(seat_detail).length > 0) {
        const selected_index = state.seatSelection.indexOf(action.payload);
        if (selected_index > -1) {
          state.seatSelection.splice(selected_index, 1);
          if (state.seatSelection.length === 0) {
            state.selected_seat_row = ""
            state.min_selected_seatID = ""
            state.max_selected_seatID = ""
            state.selected_zone = ""
            state.single_price = "0"
          } else if (seat_detail["seat_id"] === state.min_selected_seatID) {
            state.min_selected_seatID = seat_detail["seat_id"] + 1
          } else if (seat_detail["seat_id"] === state.max_selected_seatID) {
            state.max_selected_seatID = seat_detail["seat_id"] - 1
          } else {
            throw new Error('Invalid [ticket_id] to remove. (input: ' + action.payload + ')');
          }
        } else {
          throw new Error('cannot find [ticket_id] in [state.seatSelection] to remove.');
        }
      } else {
        throw new Error('Invalid [ticket_id]. cannot find [ticket_id] in [state.seatDetail].');
      }
    },
    resetSeatSelection: (state) => {
      state.seatSelection = []
      state.seat2ndSelection = []
      state.selected_seat_row = ""
      state.min_selected_seatID = ""
      state.max_selected_seatID = ""
      state.selected_zone = ""
      state.single_price = "0"
    },
    addSeat2ndSelection: (state, action) => {
      state.seat2ndSelection.push(action.payload)
    },
    removeSeat2ndSelection: (state, action) => {
      const selected_index = state.seat2ndSelection.indexOf(action.payload);
      if (selected_index > -1) {
        state.seat2ndSelection.splice(selected_index, 1);
      } else {
        throw new Error('cannot find [ticket_id] in [state.seat2ndSelection] to remove.');
      }
    },
    updateMarketPrice: (state, action) => {
      // let newMarketplacePrices = { ...state.marketplace_prices };
      // for (let ticket_id in action.payload) {
      //   newMarketplacePrices[ticket_id] = action.payload[ticket_id];
      // }
      // console.log(newMarketplacePrices)
      // state.marketplace_prices = newMarketplacePrices
      state.marketplace_prices = action.payload
    },
    updateSelectedZone: (state, action) => {
      state.selected_zone = action.payload
    },
    setSeatDetail: (state, action) => {
      let zone_available = {}
      let zone_seat = {}
      for (const data of action.payload) {
        if (!zone_available.hasOwnProperty(data['zone'])) {
          zone_available[data['zone']] = {
            available: 0,
            price: data['price'],
          }
        }
        if (is_ticket_available(data)) {
          zone_available[data['zone']]['available'] += 1
        }

        if (!zone_seat.hasOwnProperty(data['zone'])) {
          zone_seat[data['zone']] = {}
        }
        zone_seat[data['zone']][data['ticket_id']] = data
      }
      state.seatDetail = zone_seat
      state.zoneAvailability = zone_available
    },
    updateSeatDetail: (state, action) => {
      // let zone_available = {}
      let zone_seat_range = {}
      Object.entries(state.seatDetail).forEach(([zone, ticket_list]) => {
        let max_index = Math.max(...Object.keys(ticket_list).map(Number))
        let min_index = Math.min(...Object.keys(ticket_list).map(Number))
        zone_seat_range[zone] = [min_index, max_index]
      })

      for (const data of action.payload) {
        let ticket_id = data['ticket_id']
        for (let zone in zone_seat_range) {
          let seat_range = zone_seat_range[zone]
          if (ticket_id >= seat_range[0] && ticket_id <= seat_range[1]) {
            let prev_status = is_ticket_available(state.seatDetail[zone][ticket_id])
            let current_status = is_ticket_available(data)
            if (prev_status !== current_status) {
              if (current_status === true) {
                state.zoneAvailability[zone]['available'] += 1
              } else {
                state.zoneAvailability[zone]['available'] -= 1
              }
            }
            state.seatDetail[zone][ticket_id] = data
            break
          }
        }
      }

    },
    updateEventDetail: (state, action) => {
      state.eventDetail = action.payload
    },
    nextPurchaseState: (state) => {
      if (state.purchaseState < 3) {
        state.purchaseState += 1
      } else {
        throw new Error('already at max purchaseState (ref: 3).');
      }
    },
    backPurchaseState: (state) => {
      if (state.purchaseState > 1) {
        state.purchaseState -= 1
      } else {
        throw new Error('already at min purchaseState (ref: 1).');
      }
    },
    jumpPurchaseState: (state, action) => {
      if (action.payload >= 1 && action.payload <= 3) {
        state.purchaseState = action.payload
      } else {
        throw new Error('Input purchaseState invalid.');
      }
    },
    resetPurchaseState: (state) => {
      state.purchaseState = 1
    },
    updateSingleGasFee: (state, action) => {
      state.single_gas_fee = action.payload
    },
    updateSingle2ndGasFee: (state, action) => {
      state.single_2nd_gas_fee = action.payload
    },
    setOrderID: (state, action) => {
      state.order_id = action.payload
    },
    resetOrderID: (state) => {
      state.order_id = ""
    },
    setupPurchaseResult: (state, action) => {
      if (action.payload === null) {
        for (let seat_id of state.seatSelection) {
          let purchase_result = {
            result: null,
            transaction: null,
            error_msg: "",
          }
          state.purchase_results[seat_id] = purchase_result
        }
      } else {
        state.purchase_results = action.payload
      }
    },
    updatePurchaseResult: (state, action) => {
      for (let input_seatID in action.payload) {
        if (state.purchase_results.hasOwnProperty(input_seatID)) {
          if ("result" in action.payload[input_seatID]) {
            state.purchase_results[input_seatID]["result"] = action.payload[input_seatID]["result"]
          }
          if ("error_msg" in action.payload[input_seatID]) {
            state.purchase_results[input_seatID]["error_msg"] = action.payload[input_seatID]["error_msg"]
          }
          if ("transaction" in action.payload[input_seatID]) {
            state.purchase_results[input_seatID]["transaction"] = action.payload[input_seatID]["transaction"]
          }
          if ("purchase_form" in action.payload[input_seatID]) {
            state.purchase_results[input_seatID]["purchase_form"] = action.payload[input_seatID]["purchase_form"]
          }
          if ("seller" in action.payload[input_seatID]) {
            state.purchase_results[input_seatID]["seller"] = action.payload[input_seatID]["seller"]
          }
        } else {
          throw new Error(input_seatID + ' not found in state.purchase_results')
        }
      }
    },
    resetPurchaseResult: (state) => {
      state.purchase_results = {}
    },
    resetPurchaseDetail: (state) => {
      resetPurchaseState()
      resetSeatSelection()
      resetOrderID()
      resetPurchaseResult()
    },
    test_func: (state, action) => {
      console.log(action)
    },
    setEventID: (state, action) => {
      state.event_id = action.payload
    },
    resetEventID: (state) => {
      state.event_id = null
    },
  }
})

// Action creators are generated for each case reducer function
export const { 
  addSeatSelection,
  removeSeatSelection,
  resetSeatSelection,
  addSeat2ndSelection,
  removeSeat2ndSelection,
  updateMarketPrice,
  get_2ndHand_price,
  updateSelectedZone,
  setSeatDetail,
  updateSeatDetail,
  updateEventDetail,
  nextPurchaseState,
  backPurchaseState,
  jumpPurchaseState,
  resetPurchaseState,
  updateSingleGasFee,
  updateSingle2ndGasFee,
  setOrderID,
  resetOrderID,
  setupPurchaseResult,
  updatePurchaseResult,
  resetPurchaseResult,
  resetPurchaseDetail,
  setEventID,
  resetEventID,
  test_func,
} = purchaseSlice.actions

export default purchaseSlice.reducer