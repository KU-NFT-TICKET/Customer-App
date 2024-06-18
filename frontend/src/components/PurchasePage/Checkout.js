import React from "react";
import { BigNumber, ethers } from 'ethers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faClock, faCalendarPlus, faCircleDollarToSlot, faTicket } from '@fortawesome/free-solid-svg-icons'
import { ReactComponent as Avax } from '../../img/avax-icon.svg';
import { formatInTimeZone } from 'date-fns-tz';
import Swal from 'sweetalert2'
import withRouter from '../../js/withRouter';
import {BrowserRouter as Router, Link, useNavigate} from 'react-router-dom'
import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { compose } from "redux";
import { connect } from "react-redux";
import { 
  nextPurchaseState,
  backPurchaseState,
} from '../../features/purchase/purchaseSlice';
import Timer from "../Timer"

// axios.defaults.headers.common['Authorization'] = process.env.REACT_APP_API_TOKEN
// axios.defaults.headers.common['Authorization'] = 'Basic '+ Buffer.from(process.env.REACT_APP_API_TOKEN).toString('base64');

export class Checkout extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      
    }

    this.baseState = this.state

    this.next_state = this.next_state.bind(this)
    this.back_state = this.back_state.bind(this)
    this.confirmClickHandler = this.confirmClickHandler.bind(this)
    this.cancelClickHandler = this.cancelClickHandler.bind(this)
  }

  next_state() {
    this.props.dispatch(nextPurchaseState())
  }

  back_state() {
    this.props.dispatch(backPurchaseState())
  }

  confirmClickHandler() {
    Swal.fire({
      title: "<span style='font-size:1em'>Any transactions that have been completed cannot be refunded.</span>",
      // text: "The reservation will be released for others.",
      icon: "info",
      iconColor: "#E3B04B",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: "#E3B04B",
      cancelButtonColor: "#7F786B",
      confirmButtonText: "I understand",
      cancelButtonText: "Let me think",
    }).then((result) => {
      if (result.isConfirmed) {
        this.props.dispatch(nextPurchaseState())
      }
    });
  }

  cancelClickHandler() {
    // popup cancel
    Swal.fire({
      title: "Are you sure?",
      text: "The reservation will be released for others.",
      icon: "warning",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: "#E3B04B",
      cancelButtonColor: "#7F786B",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then(async(result) => {
      if (result.isConfirmed) {
        // post api cancel_order
        console.log("cancel order")
        this.props.cancel_order()

        // this.props.navigate('/event/' + this.prop.purchase.event_id)
        this.props.navigate('/events')
      }
    });
    
  }

  componentDidMount() {
   
  }

  componentDidUpdate(prevProps, prevState) {
    
  }

  componentWillUnmount() {

  }

  render() {
    let event_detail = this.props.events.all_events[this.props.purchase.event_id]
    let imgurl = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/" + this.props.purchase.event_id + ".png"

    let show_datetime_event = formatInTimeZone(new Date(event_detail.date_sell), this.props.account_detail.timezone, 'iiii d MMMM yyyy, HH:mm')
    let selectedSeats = [...this.props.purchase.seatSelection].sort()
    let selectedZone = this.props.purchase.selected_zone
    let summary_table = []
    let total_price = BigNumber.from(0)
    let fees = []
    if (this.props.purchase.single_2nd_gas_fee !== "0") {
      let min_fee = parseFloat(ethers.utils.formatEther(this.props.purchase.single_2nd_gas_fee)).toFixed(3)
      fees.push(min_fee)
    }
    if (this.props.purchase.single_gas_fee !== "0") {
      let max_fee = parseFloat(ethers.utils.formatEther(this.props.purchase.single_gas_fee)).toFixed(3)
      fees.push(max_fee)
    }
    
    for (let ticket_id of selectedSeats) {
        let this_seat_detail = this.props.purchase.seatDetail[selectedZone][ticket_id]
        let seat_no = this_seat_detail['seat_row'] + this_seat_detail['seat_id']
        let resale_label = ""
        let price = BigNumber.from(this_seat_detail['price'])
        let fee = BigNumber.from(this.props.purchase.single_gas_fee)

        if (Object.keys(this.props.purchase.marketplace_prices).includes(ticket_id.toString())) {
            resale_label = <span className="ms-1 resale-label">Resale</span>
            price = BigNumber.from(this.props.purchase.marketplace_prices[ticket_id])
            fee = BigNumber.from(this.props.purchase.single_2nd_gas_fee)
        }

        let price_fee = price.add(fee)
        total_price = total_price.add(BigNumber.from(price_fee))

        summary_table.push(
            <div className="row my-2 align-items-center">
                <div className="col-3">
                {selectedZone}
                </div>
                { 
                  (resale_label === "") ? (
                    <div className="col-3">
                    <span>{seat_no}</span>
                    </div>
                  ) : (
                    <div className="col-3" style={{paddingLeft: '2.6em'}}>
                    <span>{seat_no}</span>{resale_label}
                    </div>
                    
                  )
                }
                <div className="col-3">
                {parseFloat(ethers.utils.formatEther(price_fee)).toFixed(3)}
                </div>
                <div className="col-3">

                </div>
            </div>
        )
    }

    return (
      <div className="container-lg">
        <div className="row mt-5">
          <div className="col p-2 payment-countdown">
            <h1 className="m-2">Time Remain <Timer targetDate={this.props.deadline_time} onTimerEnd={this.props.onTimerEnd} /></h1>
            <p className="m-0">We reserved the seats for you!</p>
            <p className="m-0">Please completed your payment winthin 15 minutes. Before we have to release the seats for others.</p>
          </div>
        </div>
        <div className="row mt-5 p-3 checkout-content">
          <div className="col">
            <div className="row my-3 align-items-center">
              <div className="col-sm-2">
                  <img className="poster" src={imgurl} /> 
              </div>
              <div className="col-sm-10 text-start">
                <div className="row">
                  <div className="col-sm-11">
                      <ul>
                      <li className="row">
                          <h2 className="event-name">{event_detail.event_name}</h2>
                      </li>
                      <li className="row">
                          <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarDays} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                          <div className="col-sm-11">
                          <small className="small-color">Show Date</small>
                          <div>{show_datetime_event}</div>
                          </div>
                      </li>
                      <li className="row">
                          <div className="col-sm-1"><FontAwesomeIcon icon={faLocationDot} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                          <div className="col-sm-11">
                          <small className="small-color">Venue</small>
                          <div>{event_detail.venue}</div>
                          </div>
                      </li>
                      </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="row mb-1">
              <div className="col text-start">
                <span className="fw-bold">Order no. # {this.props.purchase.order_id}</span>
              </div>
            </div>
            <div className="row mb-5">
              <div className="col purchase-summary">
                <div className="row">
                  <div className="col pb-3 summary-table">
                    <div className="row py-1 header">
                      <div className="col-3">
                      Zone
                      </div>
                      <div className="col-3">
                      Seat No.
                      </div>
                      <div className="col-3">
                      Price**
                      </div>
                    </div>
                    {summary_table}
                  </div>
                </div>
                <div className="row">
                  <div className="col py-2 text-end total">
                    <h3 className="mb-0">Total {parseFloat(ethers.utils.formatEther(total_price)).toFixed(3)} <Avax className="avax-base mb-1" style={{width: "0.8em", height: "0.8em"}} /></h3>
                    <Link className="fee-info-link" to="/help/why-do-i-have-to-pay-fee" target="_blank">
                      ** Include Fee per ticket {fees.join("-")} <Avax className="avax-info mb-1" style={{width: "0.8em", height: "0.8em"}} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="row mb-5 justify-content-between">
              <div className="col-sm-3">
                <button type="button" className="btn btn-secondary btn-lg fw-bold cancel-order px-4" onClick={this.cancelClickHandler}>Cancel my order</button>
              </div>
              <div className="col-sm-3">
                <button type="button" className="btn btn-warning btn-lg fw-bold confirm px-5" onClick={this.confirmClickHandler}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  order_id: ownProps.params.order_id,
  onTimerEnd: ownProps.onTimerEnd,
  order_detail: ownProps.order_detail,
  deadline_time: ownProps.deadline_time,
  cancel_order: ownProps.cancel_order,
});

// export default withRouter(Event_Detail);
export default compose(
  withRouter,
  connect(mapStateToProps)
)(Checkout);
