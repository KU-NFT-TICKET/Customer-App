import React from "react";
import { BigNumber, ethers } from 'ethers'
import Web3 from 'web3';
import $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faRotateRight, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { ReactComponent as Avax } from '../../img/avax-icon.svg';
import DatePicker from 'react-datepicker';
import setHours from "date-fns/setHours";
import setMinutes from "date-fns/setMinutes";
import { formatInTimeZone } from 'date-fns-tz';
import addDays from "date-fns/addDays";
import { FileUploader } from "react-drag-drop-files";
import Resizer from "react-image-file-resizer";
import { Buffer } from 'buffer';
import Swal from 'sweetalert2'
import withRouter from '../../js/withRouter';
import axios from "axios"
import Select from 'react-select'
import CryptoJS from 'crypto-js'
import {BrowserRouter as Router, Link, useNavigate} from 'react-router-dom'
import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { compose } from "redux";
import { connect } from "react-redux";
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
  resetPurchaseResult, 
  resetPurchaseDetail, 
  updateMarketPrice, 
} from '../../features/purchase/purchaseSlice';
import { 
  createTicket, 
  buyProduct, 
} from '../../features/function'
import contractTicketPlace from '../../contracts/ticketMarketPlace.json'
import Timer from "../Timer"
import TrxStatusTag from "./TrxStatusTag"

export class Payment extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      is_payment_processing: false,
    }

    this.baseState = this.state

    this.retryAllClickHandler = this.retryAllClickHandler.bind(this)
    this.retryClickHandler = this.retryClickHandler.bind(this)
    this.cancelClickHandler = this.cancelClickHandler.bind(this)
  }

  async purchase_all_tickets() {
    await this.purchase_ticket(Object.keys(this.props.purchase.purchase_results))
  }

  async purchase_single_ticket(ticket_id) {
    await this.purchase_ticket([ticket_id])
  }

  async purchase_ticket(ticket_list) {
    console.log(ticket_list)
    let in_queue_id = {}
    for (let ticket_id of ticket_list) {
      if (["FAILED", ""].includes(this.props.purchase.purchase_results[ticket_id]["result"])) {
        in_queue_id[ticket_id] = {result: 'IN QUEUE'}
      }
    }
    if (Object.keys(in_queue_id).length > 0){
      this.props.dispatch(updatePurchaseResult(in_queue_id)) 
    }

    for (let ticket_id of ticket_list) {
      console.log(this.props.purchase.purchase_results[ticket_id]["result"])
      if (["FAILED", "IN QUEUE", ""].includes(this.props.purchase.purchase_results[ticket_id]["result"])) {
        let result = {}
        result[ticket_id] = {result: 'WAITING FOR PERMISSION'}
        this.props.dispatch(updatePurchaseResult(result))
        console.log(ticket_id + " -> " + this.props.purchase.purchase_results[ticket_id]["result"])

        let purchase_resp = {error: 1, msg: 'didnt run purchase process yet.'}
        let update_bind = {
          "buyer": this.props.account_detail.wallet_accounts[0],
          "order_id": this.props.purchase['order_id'],
        }
        if (Object.keys(this.props.purchase.marketplace_prices).includes(ticket_id)) {
          let market_price = this.props.purchase.marketplace_prices[ticket_id]
          purchase_resp = await buyProduct(ticket_id, market_price)
          update_bind["is_2nd_update"] = 'Y'
        } else {
          purchase_resp = await createTicket(this.props.purchase.purchase_results[ticket_id]["purchase_form"])
        }

        console.log(typeof purchase_resp)
        console.log(purchase_resp)
        if (purchase_resp['error'] === 0) {
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

        } else {
          result[ticket_id] = {result: 'FAILED', error_msg: purchase_resp['msg']}
        }
        this.props.dispatch(updatePurchaseResult(result))
      }
    }
  }

  async retryAllClickHandler() {
    this.setState({
        is_payment_processing: true
    })

    await this.purchase_all_tickets()

    this.setState({
      is_payment_processing: false
    })
  }

  async retryClickHandler(event) {
    let ticket_id = $(event.currentTarget).attr("id")
    this.setState({
      is_payment_processing: true
    })

    this.purchase_single_ticket(ticket_id)

    this.setState({
      is_payment_processing: false
    })
  }

  cancelClickHandler() {
    // popup cancel
    Swal.fire({
      title: "Are you sure?",
      text: "Any transactions that have been completed cannot be refunded.",
      icon: "warning",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: "#E3B04B",
      cancelButtonColor: "#7F786B",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then(async(result) => {
      if (result.isConfirmed) {

        let completed_count = 0
        for (let ticket_id in this.props.purchase.purchase_results) {
          let purchase_result = this.props.purchase.purchase_results[ticket_id]
          if (purchase_result["result"] === "SUCCESS") {
            completed_count += 1
          }
        }

        // post api cancel_order
        console.log("cancel order")
        // this.props.cancel_order()

        if (completed_count === 0) {
          // this.props.navigate('/event/' + this.prop.purchase.event_id)
          this.props.navigate('/events')
        } else {
          this.props.dispatch(nextPurchaseState())
        }
      }
    });
    

    // if cancel_confirm
    //     then post api cancel_order
    // else
    //     pass 
  }

  

  componentDidMount() {
    
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.purchase.purchase_results !== this.props.purchase.purchase_results) {
      let completed_count = 0
      Object.keys(this.props.purchase.purchase_results).forEach(ticket_id => {
        let trx_status = this.props.purchase.purchase_results[ticket_id]["result"]
        if (trx_status === "SUCCESS") {
          completed_count += 1
        }
      });
      console.log("completed " + completed_count + " = ticket count" + Object.keys(this.props.purchase.purchase_results).length)

      if (completed_count === Object.keys(this.props.purchase.purchase_results).length) {
        this.props.dispatch(nextPurchaseState())
      }
    }
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
        console.log(ticket_id)
        let purchase_status = this.props.purchase.purchase_results[ticket_id]['result']
        let error_msg = this.props.purchase.purchase_results[ticket_id]['error_msg']

        if (Object.keys(this.props.purchase.marketplace_prices).includes(ticket_id.toString())) {
            resale_label = <span className="ms-1 resale-label">Resale</span>
            price = BigNumber.from(this.props.purchase.marketplace_prices[ticket_id])
            fee = BigNumber.from(this.props.purchase.single_2nd_gas_fee)
        }

        let retry_icon = ""
        if (purchase_status === "FAILED") {
          if (this.state.is_payment_processing) {
            retry_icon = <div className="d-inline-block spinner">
              <FontAwesomeIcon icon={faSpinner} size="lg"/>
            </div>
          } else {
            retry_icon = <div className="d-inline-block retry-button" id={ticket_id} onClick={this.retryClickHandler}>
              <FontAwesomeIcon icon={faRotateRight} size="lg" />
            </div>
          }
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
                <div className="col-2">
                <TrxStatusTag 
                  trxStatus={purchase_status} 
                  error_msg={error_msg}
                />
                {/* <TrxStatusTag trxStatus={"PAYMENT PROCESSING"} /> */}
                </div>
                <div className="col-1 text-start">
                {retry_icon}
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
                      <div className="col-2">
                      Status
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
              <div className="col-sm-4 d-grid text-end">
                <button type="button" className="btn btn-warning btn-lg fw-bold confirm px-3" onClick={this.retryAllClickHandler}>
                {
                    (this.state.is_payment_processing) ? (
                        <div id="wave">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    ) : (
                        <span>
                            <FontAwesomeIcon icon={faRotateRight} className="me-2" />
                            Retry the remain transactions
                        </span>
                    )
                }
                </button>
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
)(Payment);
