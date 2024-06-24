import React from "react";
import { ethers, BigNumber } from 'ethers'
import Web3 from 'web3';
import $, { data } from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faClock, faCalendarPlus, faCircleDollarToSlot, faTicket } from '@fortawesome/free-solid-svg-icons'
import DatePicker from 'react-datepicker';
import setHours from "date-fns/setHours";
import setMinutes from "date-fns/setMinutes";
import { formatInTimeZone } from 'date-fns-tz';
import parseISO from 'date-fns/parseISO';
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
import {BrowserRouter as Router, Link} from 'react-router-dom'
import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { compose } from "redux";
import { connect } from "react-redux";
import { updateAllEvents } from '../features/events/eventSlice';
import { 
  updateSingleGasFee, 
  updateSingle2ndGasFee,
} from '../features/purchase/purchaseSlice';
import {
  gen_purchase_form,
  get_createTicket_gasFee,
  get_buyProduct_gasFee,
  get_2ndHand_price,
} from '../features/function'
import EventHeader from '../components/EventDetailPage/EventHeader'

class Event_Detail extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      is_mount: false,
    }

    this.baseState = this.state

    this.onConnected = this.onConnected.bind(this)
    this.setLoading = this.setLoading.bind(this)
  }

  setLoading(loading) {
    this.setState({
      loading: loading
    });
  }

  async onConnected() {
    this.setLoading(true)

    if (!Object.keys(this.props.events.all_events).includes(this.props.event_id.toString())) {
      try {
        console.time("event api");
        let get_event_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + this.props.event_id)
        console.timeEnd("event api");
        let data_detail = get_event_resp.data
        if (data_detail.length === 0) {
          console.log("redirect to 404");
          this.props.navigate('/404')
          return;
        }
        await this.props.dispatch(updateAllEvents(data_detail))
      } catch (err) {
        console.log(err)
      }
    }

    let price_detail = []
    let seat_count = 0
    console.time("seat api");
    let get_seats_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + this.props.event_id + "/seats")
    console.timeEnd("seat api");
    for (let seat_detail of get_seats_resp.data) {
      // if (this.props.purchase.single_gas_fee === "0" && seat_detail.transaction === null) {
      //   let purchase_form = gen_purchase_form(
      //     seat_detail, 
      //     this.props.events.all_events[this.props.event_id], 
      //     process.env.REACT_APP_GETGAS_ACCOUNT, 
      //     this.props.account_detail.timezone
      //   )
      //   let total_gas = await get_createTicket_gasFee(purchase_form)
      //   await this.props.dispatch(updateSingleGasFee(total_gas._hex))
      //   console.log(total_gas)
      // }

      // if (this.props.purchase.single_2nd_gas_fee === "0" && seat_detail.in_marketplace !== null) {
      //   // let {price: resale_price} = await get_2ndHand_price(seat_detail.ticket_id)
      //   // console.log(resale_price)
      //   let total_2nd_gas = await get_buyProduct_gasFee(seat_detail.ticket_id, "0", process.env.REACT_APP_GETGAS_ACCOUNT)
      //   await this.props.dispatch(updateSingle2ndGasFee(total_2nd_gas._hex))
      // }

      
      let seat_price = BigNumber.from(seat_detail.price)
      // let createTicket_fee = BigNumber.from(this.props.purchase.single_gas_fee)
      // console.log(ethers.utils.formatEther(createTicket_fee))
      // let seat_eth_price = Math.round(ethers.utils.formatEther(seat_price.add(createTicket_fee)) * 1e2) / 1e2;
      let seat_eth_price = Math.round(ethers.utils.formatEther(seat_price) * 1e2) / 1e2;
      console.log(seat_eth_price)
      if (seat_detail.owner === null) { seat_count += 1 }
      if (!price_detail.includes(seat_eth_price)) { price_detail.push(seat_eth_price) }
    }
    price_detail.sort().reverse();

    this.setState({
      price_detail: price_detail,
      seat_count: seat_count,
    })

    this.setLoading(false)
  }

  componentDidMount() {
    this.setState({
      is_mount: true
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.is_mount !== this.state.is_mount && this.state.is_mount) {
      this.onConnected()
    }
  }

  render() {
    // if (this.state.data_detail !== undefined && this.state.data_detail.event_name !== undefined && this.state.price_detail !== undefined) {
    if (this.state.loading === false) {
      let imgurl_seat = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/seat/" + this.props.event_id + ".png"
      let event_detail = this.props.events.all_events[this.props.event_id]
      return (
        <div>
          <EventHeader 
            event_id={this.props.event_id} 
            event_detail={event_detail} 
            price_detail={this.state.price_detail} 
            seat_count={this.state.seat_count}
          />
          <div className="container-lg form-style">
            <div className="row mt-4">
              <div className="row my-5">
                <div style={{
                  "backgroundImage": "url(" + imgurl_seat + ")",
                  backgroundSize: "contain", "width": "100%", "height": 500 + "px", backgroundRepeat: 'no-repeat', backgroundPosition: 'center'
                }}>
                </div>
              </div>
              <div className="row my-5">
                <div className="col-sm-10 offset-sm-1">
                  <h1 className="mb-4">Detail</h1>
                  <p style={{textAlign: 'left'}}>{event_detail.detail}</p>
                </div>
              </div>
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
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  events: state.events,
  purchase: state.purchase,
  event_id: ownProps.params.id
});

// export default withRouter(Event_Detail);
export default compose(
  withRouter,
  connect(mapStateToProps)
)(Event_Detail);

