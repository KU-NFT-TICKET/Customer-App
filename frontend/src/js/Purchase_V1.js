import React from "react";
import { BigNumber, ethers } from 'ethers'
import Web3 from 'web3';
import $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faClock, faCalendarPlus, faCircleDollarToSlot, faTicket } from '@fortawesome/free-solid-svg-icons'
import DatePicker from 'react-datepicker';
import setHours from "date-fns/setHours";
import setMinutes from "date-fns/setMinutes";
import {format, parseISO, differenceInMinutes} from 'date-fns';
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
  jumpPurchaseState, 
  resetPurchaseState, 
  updateSingleGasFee, 
  updateSingle2ndGasFee, 
  setupPurchaseResult, 
  updatePurchaseResult, 
  setOrderID, 
  resetOrderID, 
  resetPurchaseResult, 
  resetPurchaseDetail, 
  updateMarketPrice, 
} from '../features/purchase/purchaseSlice';
import { 
  is_ticket_available, 
  gen_purchase_form, 
  get_createTicket_gasFee,
  get_buyProduct_gasFee,
  get_2ndHand_price,
} from '../features/function'
import contractTicketPlace from '../contracts/ticketMarketPlace.json'
import ZoneAvailabilityBox from '../components/PurchasePage/ZoneAvailabilityBox'
// import SeatSelection from '../components/SeatSelection'
// import BookingBox from '../components/BookingBox'
import PurchaseContent from '../components/PurchasePage/PurchaseContent'

// axios.defaults.headers.common['Authorization'] = process.env.REACT_APP_API_TOKEN
// axios.defaults.headers.common['Authorization'] = 'Basic '+ Buffer.from(process.env.REACT_APP_API_TOKEN).toString('base64');

export class Purchase extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      sdate: setHours(setMinutes(addDays(new Date(), 1), 0), 8),
      edate: setHours(setMinutes(addDays(new Date(), 30), 0), 18),
      fp: null,
      fs: null,
      filePoster: null,
      fileSeat: null,
      bufferP: null,
      bufferS: null,
      id: this.props.params.id,
      holdTicket: [],
      htmlUse: [],
      // allSeatDetail: [],
      // zoneAvailability:{},
      // zoneSelectorHTML:[],
      // selectedZone: "",
      selectTicket: [],
      // purchase_button: [],
      // imgurl_seat: "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/seat/" + this.props.id + ".png",
    }

    this.baseState = this.state

    this.setImageP = this.setImageP.bind(this)
    this.setImageS = this.setImageS.bind(this)
    this.onConnected = this.onConnected.bind(this)
    this.get_single_gas_fee = this.get_single_gas_fee.bind(this)
    this.get_single_2nd_gas_fee = this.get_single_2nd_gas_fee.bind(this)
    this.purchase_all_tickets = this.purchase_all_tickets.bind(this) 
    this.buy_ticket_test = this.buy_ticket_test.bind(this)
    this.set_market_prices = this.set_market_prices.bind(this)
    this.test_state3 = this.test_state3.bind(this)
    // this.selectZone = this.selectZone.bind(this)
    // this.buy_ticket = this.buy_ticket.bind(this)
    // this.proceed_the_order = this.proceed_the_order.bind(this)
    // this.empty_warning = this.empty_warning.bind(this)
    // this.gen_purchase_button = this.gen_purchase_button.bind(this)
  }

  listenBuying() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const contractMaket = new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi,
      // provider.getSigner(),
      provider,
    )
    contractMaket.on('createTicket', (event) => {
      // Extract the relevant data from the event object
      const { eventName, args, blockNumber, blockHash, transactionHash } = event;

      // Access the event data using the event name and the event object
      console.log('Event Name:', eventName);
      console.log('Event Args:', args);
      console.log('Block Number:', blockNumber);
      console.log('Block Hash:', blockHash);
      console.log('Transaction Hash:', transactionHash);
      this.get_seats_detail(this.props.id)
      // Update your UI or trigger other actions based on the emitted event
      // ...
    });
  }

  async get_single_gas_fee() {

    let firsthand_tickets = []
    
    if (this.props.purchase.seatSelection === 0) {

    } else if (this.props.purchase.seat2ndSelection > 0) {
      firsthand_tickets = this.props.purchase.seatSelection.filter(x => !this.props.purchase.seat2ndSelection.includes(x))
    } else {
      firsthand_tickets = this.props.purchase.seatSelection
    }

    if (firsthand_tickets.length > 0) {
      let seat_detail = this.props.purchase.seatDetail[this.props.purchase.selected_zone][firsthand_tickets[0]]
      let purchase_form = gen_purchase_form(seat_detail, this.props.purchase.eventDetail, this.props.account_detail.wallet_accounts[0])
      let total_gas = await get_createTicket_gasFee(purchase_form)

      this.props.dispatch(updateSingleGasFee(total_gas._hex))
    } else {
      this.props.dispatch(updateSingleGasFee("0"))
    }
    
  }

  async get_single_2nd_gas_fee() {
    let secondhand_tickets = this.props.purchase.seat2ndSelection

    console.log(this.props.purchase.marketplace_prices)
    if (secondhand_tickets.length > 0) {
      let ticket_id = secondhand_tickets[0]
      let price = this.props.purchase.marketplace_prices[ticket_id]
      console.log(ticket_id)
      console.log(price)
      let total_2nd_gas = await get_buyProduct_gasFee(ticket_id, price, this.props.account_detail.wallet_accounts[0])

      this.props.dispatch(updateSingle2ndGasFee(total_2nd_gas._hex))
    } else {
      this.props.dispatch(updateSingle2ndGasFee("0"))
    }
  }

  async buy_ticket(event_detail, ticket_detail) {

    let booking_resp = await axios.post(process.env.REACT_APP_API_BASE_URL+"/seats/" + ticket_id, {"booking": new Date()})
    console.log("booking slots....")
    console.log(booking_resp)

    let ticket_id = ticket_detail["ticket_id"]
    let event_id = event_detail["event_id"]
    let event_name = event_detail["event_name"]
    let zone = ticket_detail["zone"]
    let seat = ticket_detail["seat_row"] + ticket_detail["seat_id"]
    let price = ticket_detail["price"]
    let limit = event_detail["purchase_limit"]
    let metadata = ticket_detail["metadata"]
    // let owner = ticket_detail["owner"]
    let owner = this.props.account_detail.wallet_accounts[0]
    // let isHold = ticket_detail["is_hold"]
    let isHold = (ticket_detail["is_hold"] === null) ? (false) : (true)


    let date_event = format(new Date(event_detail["date_event"]), 'yyyyMMddHHmm')
    let date_sell = format(new Date(event_detail["date_sell"]), 'yyyyMMddHHmm')
    let date_buy = format(new Date(), 'yyyyMMddHHmm')
    let date = [date_event, date_sell, date_buy]

    console.log(
      {
        ticket_id: ticket_id,
        event_id: event_id,
        event_name: event_name,
        date: date,
        zone: zone,
        seat: seat,
        price: price,
        limit: limit,
        metadata: metadata,
        owner: owner,
        isHold: isHold,
      }
    )

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);

    const contractMaket = await new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi,
      provider.getSigner(),
    )

    console.log("smart contract = ")
    console.log(await contractMaket.name())
    console.log(process.env.REACT_APP_TICKET_ADDRESS)
    console.log(contractMaket);

    try {
      const createTicket_resp = await contractMaket.createTicket(
        ticket_id, 
        event_id, 
        event_name, 
        date, 
        zone, 
        seat, 
        price, 
        limit, 
        metadata, 
        owner, 
        isHold,
        { value: price }
      )
      console.log(createTicket_resp)
      Swal.fire('buy success!')

      let buy_trx = createTicket_resp.hash
      // let buy_trx = "0x1c6182ecd8e78a7c53b644d1d017c20f2d067dca7c114057f02037af43bc55af"

      let update_seat_resp = await axios.patch(process.env.REACT_APP_API_BASE_URL+"/seats/" + ticket_id, {"transaction": buy_trx, "owner": owner})
      console.log("updating seat....")
      console.log(update_seat_resp)

    } catch (buy_error) {
      let show_error_text = buy_error.reason;
      if (show_error_text.includes("User denied transaction signature")) {
        show_error_text = "Purchase is cancelled. Please try again."
      } else if (show_error_text.includes("This metadata has already been used to mint an NFT.")) {
        show_error_text = "Ticket is already bought."
      } else if (show_error_text.includes("This Ticket is not for sell yet")) {
        show_error_text = "This Ticket is not for sell yet"
      } else if (show_error_text.includes("You need to pay the correct price.")) {
        show_error_text = "You need to pay the correct price."
      }
      Swal.fire(show_error_text, '', 'warning')
      console.log(buy_error)
    }

  }


  async purchase_all_tickets() { 
    console.log("purchase_all_tickets!!")
    let in_queue_id = {}
    for (let ticket_id of Object.keys(this.props.purchase.purchase_results)) {
      if (["FAILED", ""].includes(this.props.purchase.purchase_results[ticket_id]["result"])) {
        let result = {}
        in_queue_id[ticket_id] = {result: 'IN QUEUE'}
        
      }
    }
    if (Object.keys(in_queue_id).length > 0){
      this.props.dispatch(updatePurchaseResult(in_queue_id)) 
    }

    for (let ticket_id of Object.keys(this.props.purchase.purchase_results)) {
      console.log(this.props.purchase.purchase_results[ticket_id]["result"])
      if (["FAILED", "IN QUEUE", ""].includes(this.props.purchase.purchase_results[ticket_id]["result"])) {
        let result = {}
        result[ticket_id] = {result: 'WAITING FOR PERMISSION'}
        this.props.dispatch(updatePurchaseResult(result))
        console.log(ticket_id + " -> " + this.props.purchase.purchase_results[ticket_id]["result"])
        // let data = await this.buy_ticket_test(ticket_id)

        let purchase_resp = {error: 1, msg: 'didnt run purchase process yet.'}
        let update_bind = {
          "buyer": this.props.account_detail.wallet_accounts[0],
          "order_id": this.props.purchase['order_id'],
        }
        if (Object.keys(this.props.purchase.marketplace_prices).includes(ticket_id)) {
          let market_price = this.props.purchase.marketplace_prices[ticket_id]
          purchase_resp = await this.buy_ticket_from_market(ticket_id, market_price)
          update_bind["is_2nd_update"] = 'Y'
        } else {
          purchase_resp = await this.buy_ticket_test(this.props.purchase.purchase_results[ticket_id]["purchase_form"])
        }

        console.log(typeof purchase_resp)
        console.log(purchase_resp)
        if (purchase_resp['error'] == 0) {
          let resp = purchase_resp['resp']
          let trx = resp['hash']
          let gasPrice = resp['gasPrice']
          let gasUsed = BigNumber.from(0)

          result[ticket_id] = {result: 'PAYMENT PROCESSING'}
          this.props.dispatch(updatePurchaseResult(result))

          await resp.wait().then(async (receipt) => {
            console.log('Transaction mined:', receipt);

            if (receipt.status === 0) {
              console.log('Transaction failed');
              result[ticket_id] = {result: 'FAILED', error_msg: 'Error occured when the order was mining. Please contact Admin.'}
            } else if (receipt.status === 1) {
              console.log('Transaction succeeded');

              gasUsed = receipt.gasUsed
              let totalFee = gasPrice.mul(gasUsed)

              result[ticket_id]['result'] = 'SUCCESS'
              result[ticket_id]['transaction'] = trx
              // result[ticket_id]['fee'] = totalFee

              update_bind["transaction"] = trx
              update_bind["fee"] = totalFee.toString()

              console.log(update_bind)

              try {
                let update_seat_resp = await axios.post(
                  process.env.REACT_APP_API_BASE_URL+"/seats/purchase/" + ticket_id, 
                  update_bind
                )
                console.log("updating seat....")
                console.log(update_seat_resp)
              } catch (error) {
                console.error('cannot update purchase', error);
              }
              
            }
          });

          // update_bind["transaction"] = purchase_resp['trx']
          // console.log(update_bind)

          // let update_seat_resp = await axios.post(
          //   process.env.REACT_APP_API_BASE_URL+"/seats/purchase/" + ticket_id, 
          //   update_bind
          // )
          // result[ticket_id]['transaction'] = purchase_resp['trx']
          // console.log("updating seat....")
          // console.log(update_seat_resp)


        } else {
          result[ticket_id] = {result: 'FAILED', error_msg: purchase_resp['msg']}
        }
        this.props.dispatch(updatePurchaseResult(result))
      }
    }
  }

  async buy_ticket_test(purchase_form) { 

    let purchase_result = {
      error: 0,
      resp: '',
      msg: ''
    }

    console.log(
      {
        ticket_id: purchase_form['ticket_id'],
        event_id: purchase_form['event_id'],
        event_name: purchase_form['event_name'],
        date: purchase_form['date'],
        zone: purchase_form['zone'],
        seat: purchase_form['seat'],
        price: purchase_form['price'],
        limit: purchase_form['limit'],
        metadata: purchase_form['metadata'],
        owner: purchase_form['owner'],
        isHold: purchase_form['isHold'],
      }
    )

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);

    const contractMaket = await new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi,
      provider.getSigner(),
    )

    try {
      const createTicket_resp = await contractMaket.createTicket(
        purchase_form['ticket_id'], 
        purchase_form['event_id'], 
        purchase_form['event_name'], 
        purchase_form['date'], 
        purchase_form['zone'], 
        purchase_form['seat'], 
        purchase_form['price'], 
        purchase_form['limit'], 
        purchase_form['metadata'], 
        purchase_form['owner'], 
        purchase_form['isHold'],
        { value: purchase_form['price'] }
      )
      console.log(createTicket_resp)
      // Swal.fire('buy success!')

      purchase_result['resp'] = createTicket_resp

    } catch (e) {
      let show_error_text = e.reason;
      if (show_error_text.includes("User denied transaction signature")) {
        show_error_text = "Purchase is cancelled. Please try again."
      } else if (show_error_text.includes("This Ticket is not for sell yet")) {
        show_error_text = "This Ticket is not for sell yet"
      } else if (show_error_text.includes("You need to pay the correct price.")) {
        show_error_text = "You need to pay the correct price."
      }
      console.log(e)
      purchase_result['error'] = 1
      purchase_result['msg'] = show_error_text
    }

    return purchase_result

    // return new Promise(resolve => {
    //   setTimeout(() => resolve('ticket_id = ' + ticket_id), 1*1000);
    // });
  }

  async buy_ticket_from_market(ticket_id, price){

    let buy_result = {
      error: 0,
      resp: '',
      msg: ''
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // await provider.send("eth_requestAccounts", []);

    const contractMaket = await new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi,
      provider.getSigner(),
    )

    try {
      const buy_resp = await contractMaket.buyProduct(
        ticket_id,
        { value: price } 
      )
      console.log(buy_resp)
      buy_result['resp'] = buy_resp

    } catch (e) {
      let show_error_text = e.reason;
      if (show_error_text.includes("User denied transaction signature")) {
        show_error_text = "Purchase is cancelled. Please try again."
      } else if (show_error_text.includes("This metadata has already been used to mint an NFT.")) {
        show_error_text = "Ticket is already bought."
      } else if (show_error_text.includes("This Ticket is not for sell yet")) {
        show_error_text = "This Ticket is not for sell yet"
      } else if (show_error_text.includes("You need to pay the correct price.")) {
        show_error_text = "You need to pay the correct price."
      }
      console.log(e)
      buy_result['error'] = 1
      buy_result['msg'] = show_error_text
    }

    return buy_result

  }

  async get_event_detail(event_id) {
    let data_detail = {}
    try {
      const events_details = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + event_id)
      data_detail = events_details.data[0]
      data_detail = {
        'event_id': data_detail.event_id,
        'event_name': data_detail.event_name,
        // 'date_sell': format(new Date(data_detail.date_sell), 'MM/dd/yyyy HH:mm'),
        'date_sell': data_detail.date_sell,
        // 'date_event': format(new Date(data_detail.date_event), 'MM/dd/yyyy HH:mm'),
        'date_event': data_detail.date_event,
        'show_date_sell': format(new Date(data_detail.date_sell), 'iiii d MMMM yyyy HH:mm'),
        'show_date_event': format(new Date(data_detail.date_event), 'iiii d MMMM yyyy'),
        'show_time_event': format(new Date(data_detail.date_event), 'HH:mm'),
        'detail': data_detail.detail,
        'purchase_limit': data_detail.purchase_limit,
        'venue': data_detail.venue,
        'creator': data_detail.creator.toLowerCase(),
      }
      this.props.dispatch(updateEventDetail(data_detail))
    } catch (err) {
      console.log(err)
    }

    var seat_count = {}
    var price_detail = []
    try {
      var seats_of_event_recs = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + event_id + "/seats")
      seat_count = {'seat_count': 0 }
      for (let seat_detail of seats_of_event_recs.data) {
        let seat_eth_price = Math.round(ethers.utils.formatEther(seat_detail.price) * 1e2) / 1e2;
          if (seat_detail.owner === null) { seat_count.seat_count += 1 }
          if (!price_detail.includes(seat_eth_price)) { price_detail.push(seat_eth_price) }
      }
      price_detail.sort().reverse();
      // seat_count = {'seat_count': seats_of_event_recs.data.map(function (s_row) { if (s_row.owner === null) return s_row; }).length};
      // seat_count = {'seat_count': seats_of_event_recs.data.length}

    } catch (err) {
      console.log(err)
    }

    this.setState({
      data_detail: data_detail,
      price_detail: price_detail,
      seat_count: seat_count,
      sdate: new Date(data_detail.date_sell),
      edate: new Date(data_detail.date_event)
    })
  }

  async get_orders_detail(event_id) {
    const my_event_orders = await axios.get(process.env.REACT_APP_API_BASE_URL+"/orders?event_id=" + event_id + "&buyer=" + this.props.account_detail.wallet_accounts[0] 
      + "&is_intime=true"
    )

    let this_zone = ""
    let completed_trx = 0
    let available_orders = {}
    for (let order_detail of my_event_orders.data) {
      // let seat_detail = this.props.purchase.seatDetail[this.props.purchase.selected_zone][this.props.purchase.seatSelection[0]]
      // let purchase_form = gen_purchase_form(seat_detail, this.props.purchase.eventDetail, this.props.account_detail.wallet_accounts[0])

      // get zone
      if (this_zone == "") {
        if (order_detail["transaction"] === null) {
          this.props.dispatch(setOrderID(order_detail["order_id"]))
        }
        
        for (let zone of Object.keys(this.props.purchase.seatDetail)) {
          console.log(order_detail["ticket_id"])
          console.log(zone)
          let min_seatid = Math.min.apply(Math, Object.keys(this.props.purchase.seatDetail[zone]))
          let max_seatid = Math.max.apply(Math, Object.keys(this.props.purchase.seatDetail[zone]))
          console.log(min_seatid)
          console.log(max_seatid)
          if (min_seatid <= order_detail["ticket_id"] && order_detail["ticket_id"] <= max_seatid) {
            this_zone = zone
            console.log('in')
            break
          } 
        }
      }

      // gen puschase form
      let purchase_form = gen_purchase_form(
        this.props.purchase.seatDetail[this_zone][order_detail["ticket_id"]], 
        this.props.purchase.eventDetail, 
        this.props.account_detail.wallet_accounts[0]
      )

      // filtered book time
      // let order_created_date = parseISO(order_detail["created_date"])
      // console.log(order_created_date)
      // let diff_mins = differenceInMinutes(new Date(), order_created_date)
      // if (diff_mins <= 60*24*30) {
      //   let purchase_result = "FAILED"
      //   if (order_detail["executed_date"] !== null && order_detail["transaction"] !== null) {
      //     purchase_result = "SUCCESS"
      //   } else {
      //     purchase_result = "FAILED"
      //   }
      //   available_orders[order_detail["ticket_id"]] = {
      //     result: purchase_result, 
      //     transaction: order_detail["transaction"],
      //     purchase_form: purchase_form
      //   }
      // }

      // set results
      let purchase_result = ""
      if (order_detail["executed_date"] !== null && order_detail["transaction"] !== null) {
        purchase_result = "SUCCESS"
        completed_trx += 1
      } else {
        purchase_result = ""
      }
      available_orders[order_detail["ticket_id"]] = {
        result: purchase_result, 
        transaction: order_detail["transaction"],
        seller: order_detail["seller"],
        purchase_form: purchase_form,
      }
    }
    if (Object.keys(available_orders).length > 0 && Object.keys(available_orders).length != completed_trx) {
      this.props.dispatch(setupPurchaseResult(available_orders))
      this.props.dispatch(updateSelectedZone(this_zone))
      // this.props.dispatch(jumpPurchaseState(3))
    }

  }

  async get_seats_detail(event_id) {
    const seats_detail = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + event_id + "/seats")
    console.log("Seat Detail:")
    console.log(seats_detail)

    this.props.dispatch(setSeatDetail(seats_detail.data))
  }


  setImageP(event) {
    var fileInput = false;
    if (event[0]) {
      fileInput = true;
      this.setState({ fp: event });
      const readerP = new window.FileReader();
      readerP.readAsArrayBuffer(event[0]);
      readerP.onloadend = () => {
        this.setState({ bufferP: Buffer(readerP.result) })
        console.log("BufferP data: ", Buffer(readerP.result));
      }
    }
    if (fileInput) {
      try {
        Resizer.imageFileResizer(
          event[0],
          300,
          300,
          "PNG",
          100,
          0,
          (uri) => {
            this.setState({ filePoster: uri });
          },
          "base64",
          200,
          200
        );
      } catch (err) {
        console.log(err);
      }
    }
  }

  setImageS(event) {
    var fileInput = false;
    if (event[0]) {
      fileInput = true;
      this.setState({ fs: event });
      const readerS = new window.FileReader();
      readerS.readAsArrayBuffer(event[0]);
      readerS.onloadend = () => {
        this.setState({ bufferS: Buffer(readerS.result) })
        console.log("BufferS data: ", Buffer(readerS.result));
      }
    }
    if (fileInput) {
      try {
        Resizer.imageFileResizer(
          event[0],
          300,
          300,
          "PNG",
          100,
          0,
          (uri) => {
            this.setState({ fileSeat: uri });
          },
          "base64",
          200,
          200
        );
      } catch (err) {
        console.log(err);
      }
    }
  }


  async set_market_prices() {
    let market_prices = {}
    let promises = []

    for (let zone in this.props.purchase.seatDetail) {
      for (let ticket_id in this.props.purchase.seatDetail[zone]) {
        let seat_detail = this.props.purchase.seatDetail[zone][ticket_id]
        if (seat_detail.in_marketplace !== null) {
          let promise = get_2ndHand_price(ticket_id)
            .then(market_price => {
              market_prices[ticket_id] = market_price['price'].toString()
            })
          promises.push(promise)
        }
      }
    }

    await Promise.all(promises)
    console.log(market_prices)

    this.props.dispatch(updateMarketPrice(market_prices))
  }

  async test_state3() {
    let available_orders = {
      1224: {
        result: "", 
        transaction: null,
        seller: this.props.account_detail.wallet_accounts[0],
        purchase_form: null,
      },
      1225: {
        result: "", 
        transaction: null,
        seller: this.props.account_detail.wallet_accounts[0],
        purchase_form: null,
      },
    }

    this.props.dispatch(setOrderID("test-123"))
    this.props.dispatch(setupPurchaseResult(available_orders))
  }

  async onConnected() {
    // const provider = new ethers.providers.Web3Provider(window.ethereum)
    // await provider.send("eth_requestAccounts", []);
    // const accounts = await provider.listAccounts();

    await this.get_event_detail(this.props.id)    
    await this.get_seats_detail(this.props.id)    
    await this.set_market_prices()    
    await this.get_orders_detail(this.props.id) 
    // await this.test_state3(this.props.id)    

    if (Object.keys(this.props.purchase.purchase_results).length > 0) {
      this.props.dispatch(jumpPurchaseState(3))
    }
  }

  componentDidMount() {
    this.onConnected()
    // this.get_seats_detail(this.props.id)
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log("zone = " + this.state.selectedZone)
    if (prevProps.purchase.seatSelection !== this.props.purchase.seatSelection) {
      // this.set_gas_and_market_price(prevProps, prevState)
      this.get_single_gas_fee()
    }

    if (this.props.purchase.seat2ndSelection !== prevProps.purchase.seat2ndSelection) {
      this.get_single_2nd_gas_fee()
    }

    if (
      prevProps.purchase.purchaseState !== this.props.purchase.purchaseState &&
      prevProps.purchase.purchaseState === 2 &&
      this.props.purchase.purchaseState === 3
      ) {
      // this.purchase_all_tickets()
    } else if (
      prevProps.purchase.purchaseState !== this.props.purchase.purchaseState &&
      prevProps.purchase.purchaseState === 1 &&
      this.props.purchase.purchaseState === 3
      ) {
      // generate buy form 
    }
  }

  componentWillUnmount() {
    console.log("unmount purchase kub.")
    // this.props.dispatch(resetSeatSelection())
    this.props.dispatch(resetOrderID())
    this.props.dispatch(resetPurchaseState())
    this.props.dispatch(resetPurchaseResult())
    // this.props.dispatch(resetPurchaseDetail())
  }

  render() {
    if (this.props.account_detail.isLogin && this.props.purchase.seatDetail) {
      var purchase_link = "/event_detail/"+this.props.id+"/purchase";
      var imgurl = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/" + this.props.id + ".png"
      let date_ob = new Date();
      if (this.state.data_detail !== undefined && this.state.data_detail.event_name !== undefined && this.state.price_detail !== undefined) {
        var price_detail = []
        for (var i = 0; i < this.state.price_detail.length; i++) {
          price_detail.push(this.state.price_detail[i]['price'])
        }
        var price_show = '~' + price_detail.join(', ~') + ' AVAX'
        var status_event = ''
        var status_txt = ''
        var show_edit = false
        var display = {}
        var display_trans = {}
        if (date_ob >= new Date(this.state.data_detail.date_event)) {
          display_trans = { 'display': 'none' }
        }
        if (date_ob <= new Date(this.state.data_detail.date_event)) {
          if (this.state.seat_count.seat_count > 0) {
            if (date_ob >= new Date(this.state.data_detail.date_sell)) {
              // ticket on sell
              status_event = 'status-event status-on'
              status_txt = 'ON SELL'
              show_edit = true
              display = { 'display': 'none' }
            } else {
              status_event = 'status-event status-hold'
              status_txt = 'NOT AVAILABLE'
            }
          } else {
            status_event = 'status-event status-off'
            status_txt = 'SOLD OUT'
            show_edit = true
            display = { 'display': 'none' }
          }
        } else {
          status_event = 'status-event status-off'
          status_txt = 'EVENT CLOSE'
          show_edit = true
          display = { 'display': 'none' }
        }
        return (
          <div>
            <br />
            <div className="row" style={{ color: 'white' }}>
              {/*<div className="col-sm-8" style={{ textAlign: 'left', 'position': 'relative' }}>*/}
              <div className="col-sm-7 text-start">
                {/*<span>{this.state.data_detail.detail}</span>*/}
                <div className="row div-event">
                  <div className="col-sm-12">
                    <ul className="event-ul">
                      <li className="row">
                        <h1>{this.state.data_detail.event_name}</h1>
                      </li>
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarDays} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                        <div className="col-sm-11">
                          <small className="small-color">Show Date</small>
                          <div>{this.state.data_detail.show_date_event}, {this.state.data_detail.show_time_event}</div>
                        </div>
                      </li>
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faLocationDot} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                        <div className="col-sm-11">
                          <small className="small-color">Venue</small>
                          <div>{this.state.data_detail.venue}</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-sm-4 offset-sm-1">
                <div className="row div-event" style={{'padding': '20px'}}>
                  <div className="col-sm-12">
                    <ZoneAvailabilityBox zoneAvailability={this.props.purchase.zoneAvailability} />
                  </div>
                </div>
              </div>
            </div>
            <br />
            <div className="row">
              <PurchaseContent purchase_all_tickets={this.purchase_all_tickets} />
            </div>
          </div>
        )
      } else {
        return <img src={require('../img/loading.gif')} />
      }
    } else {
      return (
        <div className="card mb-3 panel-style">
          <div className="card-body">
            <h5 className="card-title">Login Required.</h5>
            <p className="card-text">Please login before proceed to Purchase Page.</p>
          </div>
        </div>
      )
    }
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  id: ownProps.params.id,

});

// export default withRouter(Event_Detail);
export default compose(
  withRouter,
  connect(mapStateToProps)
)(Purchase);
