import React from "react";
import { BigNumber, ethers } from 'ethers'
import Web3 from 'web3';
import $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStopwatch } from '@fortawesome/free-solid-svg-icons'
import DatePicker from 'react-datepicker';
import setHours from "date-fns/setHours";
import setMinutes from "date-fns/setMinutes";
import {format, parseISO, differenceInMinutes, addMinutes} from 'date-fns';
import moment from 'moment';
import addDays from "date-fns/addDays";
import { FileUploader } from "react-drag-drop-files";
import Resizer from "react-image-file-resizer";
import { Buffer } from 'buffer';
import { uploadPic, deletePic } from './fileS3';
import Swal from 'sweetalert2'
import withRouter from './withRouter';
import axios from "axios"
import Select from 'react-select'
import CryptoJS from 'crypto-js'
import {BrowserRouter as Router, Link, useNavigate} from 'react-router-dom'
import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { compose } from "redux";
import { connect } from "react-redux";
import { updateAllEvents } from '../features/events/eventSlice';
import { 
  updateEventDetail, 
  setSeatDetail, 
  updateSeatDetail, 
  resetSeatSelection, 
  updateSelectedZone, 
  nextPurchaseState,
  backPurchaseState,
  jumpPurchaseState, 
  resetPurchaseState, 
  updateSingleGasFee, 
  updateSingle2ndGasFee, 
  setupPurchaseResult, 
  updatePurchaseResult, 
  setOrderID, 
  resetOrderID, 
  setEventID,
  resetPurchaseResult, 
  resetPurchaseDetail, 
  updateMarketPrice,
  addSeatSelection, 
} from '../features/purchase/purchaseSlice';
import { 
  is_ticket_available, 
  gen_purchase_form, 
  get_createTicket_gasFee,
  get_buyProduct_gasFee,
  get_2ndHand_price,
} from '../features/function'
import contractTicketPlace from '../contracts/ticketMarketPlace.json'
import Checkout from '../components/PurchasePage/Checkout'
import Payment from '../components/PurchasePage/Payment'
import Summary from '../components/PurchasePage/Summary'

// axios.defaults.headers.common['Authorization'] = process.env.REACT_APP_API_TOKEN
// axios.defaults.headers.common['Authorization'] = 'Basic '+ Buffer.from(process.env.REACT_APP_API_TOKEN).toString('base64');

export class Purchase extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      is_mount: false,
      loading: 1,
      order_detail: [],
      deadline_time: null,
    }

    this.baseState = this.state

    this.timeUpsHandler = this.timeUpsHandler.bind(this)
    this.onLoad = this.onLoad.bind(this)
    this.transform_seat_data = this.transform_seat_data.bind(this)
    this.cancel_order = this.cancel_order.bind(this)
  }

  timeUpsHandler() {
    let timerInterval;
    Swal.fire({
      title: "<span style='color:var(--text-color);font-size:1.25em;font-weight:700;'>Times up!</span>",
      html: "<span style='color:var(--gray-color);'>The reservation was released for others.<br>" +
      "But you can try again if the seats still available.</span>",
      confirmButtonColor: "#E3B04B",
      timer: 5000,
      // timerProgressBar: true,
      didOpen: () => {
        // Swal.showLoading();
        timerInterval = setInterval(() => {
        }, 100);
      },
      willClose: () => {
        clearInterval(timerInterval);
      }
    }).then((result) => {
      /* Read more about handling dismissals below */
      console.log(result)
      if (
        result.isConfirmed ||
        result.dismiss === Swal.DismissReason.timer ||
        result.dismiss === Swal.DismissReason.backdrop
      ) {
        // cancel order (optional)

        console.log("Exit to event page");
        this.props.navigate('/events')
      } 
    });
  }

  cancel_order() {
    for (let ticket_id in this.props.purchase.purchase_results) {
      let purchase_result = this.props.purchase.purchase_results[ticket_id]
      if (purchase_result.result !== "SUCCESS") {
        let cancel_resp = axios.delete(process.env.REACT_APP_API_BASE_URL+"/orders/"+this.props.order_id+"/seat/"+ticket_id)
        console.log(cancel_resp)
      }
    }
  }

  async transform_seat_data(seat_list) {
    let firsthand_total_price = "0"
    let total_2nd_gas = BigNumber.from(0)
    let market_prices = {}
    let input_seat_list = []
    for (let seat_detail of seat_list) {
      if (this.props.purchase.single_gas_fee === "0" && seat_detail.transaction === null) {
        let purchase_form = gen_purchase_form(
          seat_detail, 
          this.props.events.all_events[this.props.purchase.event_id], 
          this.props.account_detail.wallet_accounts[0], 
          this.props.account_detail.timezone
        )
        let total_gas = await get_createTicket_gasFee(purchase_form)
        await this.props.dispatch(updateSingleGasFee(total_gas._hex))
      }

      if (firsthand_total_price === "0") {
        let price = BigNumber.from(seat_detail.price)
        let fee = BigNumber.from(this.props.purchase.single_gas_fee)
        let total_price = price.add(fee)
        firsthand_total_price = ethers.utils.formatEther(total_price)
      }

      if (seat_detail.in_marketplace !== null) {
        let {price: resale_price} = await get_2ndHand_price(seat_detail.ticket_id)
        market_prices[seat_detail.ticket_id] = resale_price.toString()
      }


      if (this.props.purchase.single_2nd_gas_fee === "0" && seat_detail.in_marketplace !== null) {
        let resale_price = market_prices[seat_detail.ticket_id]
        total_2nd_gas = await get_buyProduct_gasFee(seat_detail.ticket_id, resale_price, this.props.account_detail.wallet_accounts[0])
        await this.props.dispatch(updateSingle2ndGasFee(total_2nd_gas._hex))
      }
      
      let shown_price = "0"
      if (seat_detail.in_marketplace === null) {
        shown_price = firsthand_total_price
      } else {
        let price = BigNumber.from(market_prices[seat_detail.ticket_id])
        let fee = BigNumber.from(this.props.purchase.single_2nd_gas_fee)
        let total_price = price.add(fee)
        shown_price = ethers.utils.formatEther(total_price)
      }
      
      let temp_row = seat_detail
      temp_row['shown_price'] = shown_price
      input_seat_list.push(temp_row)
    }
    
    return {"seat_list": input_seat_list, "market_prices": market_prices}
  }

  async onLoad(){
    console.log("onload...")
    // load order using this.prop.purchase.order_id
    console.time("get order api")
    const order_detail = await axios.get(process.env.REACT_APP_API_BASE_URL+"/orders?order_id="+this.props.order_id+"&is_intime=true&is_removed=false")
    console.timeEnd("get order api")
    console.log(this.props.order_id)
    console.log(order_detail.data)
    
    // only allow: func_name = buyProduct,createTicket and buyer = user
    let onGoing_orderDetail = []
    let allow_funcNames = ['buyProduct', 'createTicket']
    for (let order_row of order_detail.data) {
      console.log(order_row)
      console.log(this.props.account_detail.wallet_accounts[0])
      if (allow_funcNames.includes(order_row.func_name) && order_row.buyer.toLowerCase() === this.props.account_detail.wallet_accounts[0].toLowerCase()) {
        onGoing_orderDetail.push(order_row)
      }
    }
    console.log(onGoing_orderDetail)

    let ticketid_list = []
    if (onGoing_orderDetail.length > 0) {
      let created_date = new Date(onGoing_orderDetail[0].created_date)
      // console.log(created_date)

      // let deadline_time = moment(created_date).add(15, 'm').toDate();
      let deadline_time = addMinutes(created_date, 15);
      // console.log(deadline_time)

      // if new Date > deadline_time then navigate to 404
      // if (new Date() > deadline_time) {
      //   this.props.navigate('/404')
      //   return
      // }

      for (let order_detail of onGoing_orderDetail) {
        ticketid_list.push(order_detail.ticket_id)
      }

      console.log(new Date())
      console.time("get ticket api")
      const get_seats_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/seats?ticket_id="+ticketid_list.join(","))
      console.timeEnd("get ticket api")
      let seat_detail = get_seats_resp.data
      let event_id = seat_detail[0]["event_id"]
      await this.props.dispatch(setEventID(event_id)) 

      if (!Object.keys(this.props.events.all_events).includes(event_id)) {
        console.log(event_id)
        console.time("get event api")
        const get_event_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/"+event_id)
        console.timeEnd("get event api")
        let event_detail = get_event_resp.data
        await this.props.dispatch(updateAllEvents(event_detail))
      }

      let {seat_list: formatted_detail, market_prices} = await this.transform_seat_data(seat_detail)

      // console.log(onGoing_orderDetail)
      // console.log(formatted_detail)

      this.props.dispatch(setSeatDetail(formatted_detail))

      if (Object.keys(this.props.purchase.marketplace_prices).length === 0) {
        this.props.dispatch(updateMarketPrice(market_prices))
      }

      await this.props.dispatch(resetSeatSelection())

      for (let ticket_id of ticketid_list) {
        await this.props.dispatch(addSeatSelection(ticket_id)) 
      }

      let available_orders = {}
      let this_zone = this.props.purchase.selected_zone
      for (let order_detail of onGoing_orderDetail) {
        // gen purchase form
        let purchase_form = gen_purchase_form(
          this.props.purchase.seatDetail[this_zone][order_detail["ticket_id"]], 
          this.props.events.all_events[event_id], 
          this.props.account_detail.wallet_accounts[0],
          this.props.account_detail.timezone
        )

        // set results
        let purchase_result = ""
        if (order_detail["executed_date"] !== null && order_detail["transaction"] !== null) {
          purchase_result = "SUCCESS"
          // completed_trx += 1
        } else {
          purchase_result = ""
        }
        available_orders[order_detail["ticket_id"]] = {
          result: purchase_result, 
          transaction: order_detail["transaction"],
          seller: order_detail["seller"],
          purchase_form: purchase_form,
          error_msg: "",
        }
      }

      await this.props.dispatch(setupPurchaseResult(available_orders))

      this.setState({
        order_detail: formatted_detail,
        loading: 0,
        deadline_time: deadline_time,
      })
      
      // this.props.dispatch(jumpPurchaseState(3))
    } else {
      this.props.navigate('/404')
    }
  }

  componentDidMount() {
    console.log("order didMount...")
    this.setState({
      is_mount: true
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.is_mount && this.state.is_mount && this.props.account_detail.wallet_accounts.length > 0) {
      console.log("order page is mount!")
      this.onLoad()
    }
  }

  componentWillUnmount() {
    this.props.dispatch(resetPurchaseState())
  }

  render() {
    return (
      (this.state.loading) ? (
        <div className="container-lg min-vh-100 d-flex align-items-center justify-content-center">
          <div className="row">
            <div className="loading-black" style={{height: '7em'}}/>
          </div>
        </div>
      ) : (this.props.purchase.purchaseState === 1) ? (
        <Checkout 
          order_id={this.props.order_id} 
          onTimerEnd={this.timeUpsHandler} 
          order_detail={this.state.order_detail} 
          deadline_time={this.state.deadline_time}
          cancel_order={this.cancel_order}
        />
      ) : (this.props.purchase.purchaseState === 2) ? (
        <Payment 
          order_id={this.props.order_id} 
          onTimerEnd={this.timeUpsHandler} 
          order_detail={this.state.order_detail} 
          deadline_time={this.state.deadline_time}
          cancel_order={this.cancel_order}
        />
      ) : (this.props.purchase.purchaseState === 3) ? (
        <Summary 
          order_id={this.props.order_id} 
          order_detail={this.state.order_detail} 
        />
      ) : (
        this.props.navigate('/404')
      )
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    account_detail: state.account,
    purchase: state.purchase,
    events: state.events,
    order_id: ownProps.params.order_id,
  
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(Purchase);
