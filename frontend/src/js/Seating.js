import React from "react";
import { BigNumber, ethers } from 'ethers'
import Web3 from 'web3';
import $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import DatePicker from 'react-datepicker';
import setHours from "date-fns/setHours";
import setMinutes from "date-fns/setMinutes";
import { formatInTimeZone } from 'date-fns-tz';
import {parseISO, differenceInMinutes} from 'date-fns';
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
  setEventID, 
} from '../features/purchase/purchaseSlice';
import { 
  is_ticket_available, 
  gen_purchase_form, 
  get_createTicket_gasFee,
  get_buyProduct_gasFee,
  get_2ndHand_price,
} from '../features/function'
import contractTicketPlace from '../contracts/TicketMarketplace.json'
import ZoneAvailabilityBox from '../components/PurchasePage/ZoneAvailabilityBox'
import ZoneDetail from '../components/PurchasePage/ZoneDetail'
import { AuthenticationContext } from '../contexts/AuthenticationContext'

export class Seating extends React.Component {
  static contextType = AuthenticationContext;
  constructor(props) {
    super(props)

    this.state = {
      fp: null,
      fs: null,
      filePoster: null,
      fileSeat: null,
      bufferP: null,
      bufferS: null,
      holdTicket: [],
      htmlUse: [],
      selectedZone: "",
      // allSeatDetail: [],
      // zoneAvailability:{},
      // zoneSelectorHTML:[],
      // selectedZone: "",
      selectTicket: [],
      is_mount: false,
      loading: true,
    }

    this.baseState = this.state

    this.onConnected = this.onConnected.bind(this)
    this.set_market_prices = this.set_market_prices.bind(this)
    this.selectZone = this.selectZone.bind(this)
    this.transform_seat_data = this.transform_seat_data.bind(this)

    this.seatSelectionRef = React.createRef()
  }

  selectZone(event) {
    let zone_input = $(event.currentTarget).attr("id")
    console.log(zone_input)
    $(".zone-button.available.active").removeClass("active")
    $(event.currentTarget).addClass("active")
    this.setState({
      selectedZone: zone_input,
    })
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
      this.get_seats_detail(this.props.event_id)
      // Update your UI or trigger other actions based on the emitted event
      // ...
    });
  }

  async get_event_detail(event_id) {
    let data_detail = {}
    if (!Object.keys(this.props.events.all_events).includes(event_id.toString())) {
      try {
        console.time("load event "+event_id+" api");
        const get_event_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + event_id)
        console.timeEnd("load event "+event_id+" api");
        data_detail = get_event_resp.data
        if (data_detail.length === 0) {
          return;
        }
        await this.props.dispatch(updateAllEvents(data_detail))
      } catch (err) {
        console.log(err)
      }
    } 
    
    data_detail = this.props.events.all_events[event_id]
    await this.props.dispatch(setEventID(event_id))

    this.setState({
      data_detail: data_detail,
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
      // let purchase_form = gen_purchase_form(seat_detail, this.props.purchase.eventDetail, this.props.account_detail.wallet_accounts[0], this.props.account_detail.timezone)

      // get zone
      if (this_zone === "") {
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

      // gen purchase form
      let purchase_form = gen_purchase_form(
        this.props.purchase.seatDetail[this_zone][order_detail["ticket_id"]], 
        this.props.events.all_events[event_id], 
        this.props.account_detail.wallet_accounts[0],
        this.props.account_detail.timezone
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

  async transform_seat_data(seat_list) {
    let firsthand_total_price = "0"
    let total_2nd_gas = BigNumber.from(0)
    let market_prices = {}
    let input_seat_list = []
    for (let seat_detail of seat_list) {
      if (this.props.purchase.single_gas_fee === "0" && seat_detail.transaction === null) {
        let purchase_form = gen_purchase_form(
          seat_detail, 
          this.props.events.all_events[this.props.event_id], 
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

  async get_seats_detail(event_id) {
    console.time("load seat api 1");
    const get_seats_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + event_id + "/seats")
    console.timeEnd("load seat api 1");
    console.log("Seat Detail:")
    console.log(get_seats_resp)

    let seat_list = get_seats_resp.data

    let {"seat_list": input_seat_list, market_prices} = await this.transform_seat_data(seat_list)
    
    this.props.dispatch(setSeatDetail(input_seat_list))
    this.props.dispatch(updateMarketPrice(market_prices))
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

  async onConnected() {
    this.setState({
      loading: true
    });

    await this.get_event_detail(this.props.event_id) 
    if (!Object.keys(this.props.events.all_events).includes(this.props.event_id.toString())) {
      console.log("redirect to 404");
      this.props.navigate('/404')
      return;
    }
    await this.get_seats_detail(this.props.event_id)    
    // await this.set_market_prices()    
    // await this.get_orders_detail(this.props.event_id) 
    // await this.test_state3(this.props.event_id)    

    // if (Object.keys(this.props.purchase.purchase_results).length > 0) {
    //   this.props.dispatch(jumpPurchaseState(3))
    // }
    
    this.setState({
      loading: false
    });
  }

  componentDidMount() {
    this.setState({
      is_mount: true
    });
    // this.get_seats_detail(this.props.event_id)
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.is_mount !== this.state.is_mount && this.state.is_mount) {
      if (this.props.account_detail.isLogin) {
        this.onConnected()
      } else {
        const { connectWallet } = this.context;
        connectWallet(
          ()=>{this.onConnected()},
          ()=>{this.props.navigate(-1)},
        )
      }
    }
  }

  componentWillUnmount() {
    console.log("unmount purchase kub.")
    // // this.props.dispatch(resetSeatSelection())
    // this.props.dispatch(resetOrderID())
    // this.props.dispatch(resetPurchaseState())
    // this.props.dispatch(resetPurchaseResult())
    // // this.props.dispatch(resetPurchaseDetail())
  }

  render() {
    if (this.props.account_detail.isLogin && this.props.purchase.seatDetail) {
      let imgurl_seat = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/seat/" + this.props.event_id + ".png"

      let zone_buttons = []
      for (let zone of Object.keys(this.props.purchase.zoneAvailability)) {
        let available_class = "disable"
        let available_text = "Sold out"
        if (this.props.purchase.zoneAvailability[zone]['available'] > 0) {
          available_class = "available"
          available_text = "Available"
        }
        zone_buttons.push(
          <div id={zone} className={"row align-items-center zone-button " + available_class} onClick={this.selectZone}>
            <div className="col-sm-4">
              <h1 className="zone-name">{zone}</h1>
            </div>
            <div className="col-sm-8 text-end">
              <h5 className="status">{available_text}</h5>
            </div>
          </div>
        )
      }

      if (!this.state.loading) {
        return (
          <div className="container-fluid bg-cream min-vh-100" style={{ padding : 0 }}>
            <div className="container-lg py-5">
              <div className="row">
                <h1 className="fw-bold">Select Zone</h1>
              </div>
              <div className="row mt-5">
                <div className="col-sm-10">
                  <div style={{
                        "backgroundImage": "url(" + imgurl_seat + ")",
                        "backgroundSize": "contain", 
                        "width": "100%", 
                        "height": 500 + "px", 
                        backgroundRepeat: 'no-repeat', 
                        backgroundPosition: 'center'
                      }}>
                  </div>
                </div>
                <div className="col-sm-2 zone-buttons">
                  <div className="row">
                      <small>Select your zone</small>
                  </div>
                  { zone_buttons }
                </div>
              </div>
            </div>
            <div ref={this.seatSelectionRef} className="container-fluid bg-base">
              {
                (this.state.selectedZone !== "") ? (
                  <ZoneDetail 
                  selectedZone={this.state.selectedZone} 
                  frameRef={this.seatSelectionRef} 
                  transform_seat_data={this.transform_seat_data} 
                  />
                ) : null
              }
            </div>
            <div id="overlay">
              <div id="overlay-loading">
              <FontAwesomeIcon icon={faSpinner} size="lg" inverse />
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className="head-spacer">
            <img className="loading-black" style={{width: '2em', 'height': '2em'}} />
          </div>
        )
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
  event_id: ownProps.params.id,

});

// export default withRouter(Event_Detail);
export default compose(
  withRouter,
  connect(mapStateToProps)
)(Seating);
