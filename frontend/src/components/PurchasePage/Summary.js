import React from "react";
import { BigNumber, ethers } from 'ethers'
import Web3 from 'web3';
import $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons'
import { faCalendarDays, faLocationDot, faClock, faCalendarPlus, faCircleDollarToSlot, faTicket } from '@fortawesome/free-solid-svg-icons'
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
import { Link } from 'react-router-dom'
import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { compose } from "redux";
import { connect } from "react-redux";

export class Summary extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      
    }

    this.baseState = this.state
    this.viewTicketsClickHandler = this.viewTicketsClickHandler.bind(this)
    this.toEventsClickHandler = this.toEventsClickHandler.bind(this)
  }

  viewTicketsClickHandler() {
    this.props.navigate('/account/tickets')
  }

  toEventsClickHandler() {
    this.props.navigate('/events')
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
    let selectedSeats = [...Object.keys(this.props.purchase.purchase_results)].sort()
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
        if (this.props.purchase.purchase_results[ticket_id]['result'] === "SUCCESS") {
            let this_seat_detail = this.props.purchase.seatDetail[selectedZone][ticket_id]
            let seat_no = this_seat_detail['seat_row'] + this_seat_detail['seat_id']
            let resale_label = ""
            let price = BigNumber.from(this_seat_detail['price'])
            let fee = BigNumber.from(this.props.purchase.single_gas_fee)
            let transaction = this.props.purchase.purchase_results[ticket_id]['transaction']

            if (Object.keys(this.props.purchase.marketplace_prices).includes(ticket_id.toString())) {
                // resale_label = <span className="ms-1 resale-label">Resale</span>
                price = BigNumber.from(this.props.purchase.marketplace_prices[ticket_id])
                fee = BigNumber.from(this.props.purchase.single_2nd_gas_fee)
            }

            let price_fee = price.add(fee)
            total_price = total_price.add(BigNumber.from(price_fee))

            let snowtrace_link = "https://testnet.snowtrace.io/tx/" + transaction
            let tooltip = "see your transaction on Blockchain"

            summary_table.push(
                <div className="row my-2 align-items-center value">
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
                    <div className="col-3 snowtrace-link" data-filetype="txt">
                        <a className="" target="_blank" href={snowtrace_link} rel="noreferrer" title={tooltip}>
                            <img src={require('../../img/snowtrace-icon.png')} style={{height: '1em'}}/>
                            <span className="ms-1">{transaction}</span>
                        </a>
                    </div>
                    <div className="col-2 offset-1 text-start">
                    {parseFloat(ethers.utils.formatEther(price_fee)).toFixed(3)}
                    </div>
                </div>
            )
        }
    }

    return (
      <div className="container-lg order-summary">
        <div className="row justify-content-center" style={{marginTop: '5%'}}>
            <div className="col-sm-1">
                <FontAwesomeIcon icon={faCircleCheck} size="5x" style={{color: '#177B2D'}} />
            </div>
            <div className="col-sm-5">
                <h1 className="display-4 fw-bold">Order Completed</h1>
                <p className="h-4 fw-bold"># {this.props.order_id}</p>
            </div>
        </div>
        <div className="row mt-5 justify-content-center">
            <div className="col-sm-8 detail">
                <div className="row my-3 align-items-center">
                    <div className="col-sm-2">
                        <img className="poster" src={imgurl} /> 
                    </div>
                    <div className="col-sm-10 text-start">
                        <div className="row">
                            <div className="col-sm-11">
                                <ul>
                                <li className="row">
                                    <h4 className="event-name fw-bold">{event_detail.event_name}</h4>
                                </li>
                                <li className="row">
                                    <div className="col-sm-1 label"><FontAwesomeIcon icon={faCalendarDays} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                                    <div className="col-sm-11">
                                    <small className="label">Show Date</small>
                                    <div className="value">{show_datetime_event}</div>
                                    </div>
                                </li>
                                <li className="row">
                                    <div className="col-sm-1 label"><FontAwesomeIcon icon={faLocationDot} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                                    <div className="col-sm-11">
                                    <small className="label">Venue</small>
                                    <div className="value">{event_detail.venue}</div>
                                    </div>
                                </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row m-2">
                <div className="col">
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
                        Transaction
                        </div>
                        <div className="col-2 offset-1 text-start">
                        Price**
                        </div>
                        </div>
                        {summary_table}
                    </div>
                    </div>
                    <div className="row">
                    <div className="col py-2 text-end total">
                        <h3 className="mb-0">Total {parseFloat(ethers.utils.formatEther(total_price)).toFixed(3)} <Avax className="avax-red mb-1" style={{width: "0.8em", height: "0.8em"}} /></h3>
                        <Link className="fee-info-link" to="/help/why-do-i-have-to-pay-fee" target="_blank">
                        ** Include Fee per ticket {fees.join("-")} <Avax className="avax-info mb-1" style={{width: "0.8em", height: "0.8em"}} />
                        </Link>
                    </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
        <div className="row mt-5 justify-content-center">
            <div className="col-sm-3">
                <button type="button" className="btn btn-warning btn-lg fw-bold px-4" onClick={this.viewTicketsClickHandler}>View your tickets</button>
            </div>
            <div className="col-sm-3">
                <button type="button" className="btn btn-warning btn-lg fw-bold px-4" onClick={this.toEventsClickHandler}>Back to Events</button>
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
  order_detail: ownProps.order_detail,
});

// export default withRouter(Event_Detail);
export default compose(
  withRouter,
  connect(mapStateToProps)
)(Summary);
