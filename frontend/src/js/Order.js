import React from "react";
import { BigNumber, ethers } from 'ethers'
import Web3 from 'web3';
import $, { event } from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons'
import { faCalendarDays, faLocationDot, faClock, faCalendarPlus, faCircleDollarToSlot, faTicket } from '@fortawesome/free-solid-svg-icons'
import { ReactComponent as Avax } from '../img/avax-icon.svg';
import DatePicker from 'react-datepicker';
import setHours from "date-fns/setHours";
import setMinutes from "date-fns/setMinutes";
import { formatInTimeZone } from 'date-fns-tz';
import addDays from "date-fns/addDays";
import { FileUploader } from "react-drag-drop-files";
import Resizer from "react-image-file-resizer";
import { Buffer } from 'buffer';
import Swal from 'sweetalert2'
import withRouter from './withRouter';
import axios from "axios"
import Select from 'react-select'
import CryptoJS from 'crypto-js'
import { Link } from 'react-router-dom'
import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { compose } from "redux";
import { connect } from "react-redux";
import { 
    is_ticket_available, 
    gen_purchase_form, 
    get_createTicket_gasFee,
    get_buyProduct_gasFee,
    get_2ndHand_price,
} from '../features/function'
import { updateAllEvents } from '../features/events/eventSlice';

export class Order extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
        order_detail: [],
        seat_detail: {},
        seat_prices: {},
        event_id: "",
        is_mount: false,
        is_loading: true,
    }

    this.baseState = this.state
    this.onload = this.onload.bind(this)
    this.viewTicketsClickHandler = this.viewTicketsClickHandler.bind(this)
    this.toEventsClickHandler = this.toEventsClickHandler.bind(this)
  }

  viewTicketsClickHandler() {
    this.props.navigate('/account/tickets')
  }

  toEventsClickHandler() {
    this.props.navigate('/events')
  }

  async onload() {
    this.setState({
        is_loading: true
    })
    let event_id = ""
    let selectedZone = ""
    let order_detail = []
    let seat_detail = {}
    let seat_prices = {}
    const get_detail_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/orders?order_id="+this.props.order_id+"&is_removed=false")
    if (get_detail_resp.data.length > 0) {
        let ticketid_list = []
        for (let row of get_detail_resp.data) {
            if (row.transaction !== null) {
                event_id = row.event_id
                ticketid_list.push(row.ticket_id)
                if (!Object.keys(this.props.events.all_events).includes(event_id)) {
                    console.time("get event api")
                    const get_event_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/"+event_id)
                    console.timeEnd("get event api")
                    let event_detail = get_event_resp.data
                    await this.props.dispatch(updateAllEvents(event_detail))
                }
                seat_prices[row.ticket_id] = {price: row.price, fee: row.fee, trx: row.transaction}
                order_detail.push(row)
            }
        }

        console.time("get ticket api")
        const get_seats_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/seats?ticket_id="+ticketid_list.join(","))
        console.timeEnd("get ticket api")
        if (get_seats_resp.data.length > 0) {
            selectedZone = get_seats_resp.data[0]["zone"]
            for (let s_row of get_seats_resp.data) {
                seat_detail[s_row.ticket_id] = s_row
            }
        }
        
    }
    if (order_detail.length === 0) {
        this.props.navigate("/404")
    }

    this.setState({
        order_detail: order_detail,
        seat_detail: seat_detail,
        event_id: event_id,
        seat_prices: seat_prices,
        selectedZone: selectedZone,
        is_loading: false,
    })
  }

  componentDidMount() {
    this.setState({
        is_mount: true
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.is_mount !== this.state.is_mount && this.state.is_mount) {
        this.onload()
    }
  }

  componentWillUnmount() {
    
  }

  render() {
    if (!this.state.is_loading) {
        let event_detail = this.props.events.all_events[this.state.event_id]
        let imgurl = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/" + this.state.event_id + ".png"

        let show_datetime_event = formatInTimeZone(new Date(event_detail.date_sell), this.props.account_detail.timezone, 'iiii d MMMM yyyy, HH:mm')
        let selectedSeats = [...Object.keys(this.state.seat_prices)].sort()
        let selectedZone = this.state.selectedZone
        let summary_table = []
        let total_price = BigNumber.from(0)

        for (let ticket_id of selectedSeats) {
            let this_seat_detail = this.state.seat_detail[ticket_id]
            let seat_no = this_seat_detail['seat_row'] + this_seat_detail['seat_id']
            let resale_label = ""
            let price = BigNumber.from(this.state.seat_prices[ticket_id]['price'])
            let fee = BigNumber.from(this.state.seat_prices[ticket_id]['fee'])
            let transaction = this.state.seat_prices[ticket_id]['trx']

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
                            <img src={require('../img/snowtrace-icon.png')} style={{height: '1em'}}/>
                            <span className="ms-1">{transaction}</span>
                        </a>
                    </div>
                    <div className="col-2 offset-1 text-start">
                    {parseFloat(ethers.utils.formatEther(price_fee)).toFixed(3)}
                    </div>
                </div>
            )
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
                            ** Include Fee
                            </Link>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
            {/* <div className="row mt-5 justify-content-center">
                <div className="col-sm-3">
                    <button type="button" className="btn btn-warning btn-lg fw-bold px-4" onClick={this.viewTicketsClickHandler}>View your tickets</button>
                </div>
                <div className="col-sm-3">
                    <button type="button" className="btn btn-warning btn-lg fw-bold px-4" onClick={this.toEventsClickHandler}>Back to Events</button>
                </div>
            </div> */}
        </div>
        )
    } else {
        <div className="head-spacer">
          <img className="loading-black" style={{width: '2em', 'height': '2em'}} />
        </div>
    }
    
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  order_id: ownProps.params.order_id,
});

// export default withRouter(Event_Detail);
export default compose(
  withRouter,
  connect(mapStateToProps)
)(Order);
