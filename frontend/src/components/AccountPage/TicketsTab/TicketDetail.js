import React from 'react'
import $ from 'jquery';
import axios from "axios"
import { BigNumber, ethers } from 'ethers'
import { format } from 'date-fns/format';
import { formatInTimeZone } from 'date-fns-tz';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faDollarCircle } from '@fortawesome/free-solid-svg-icons'
import { QRCodeCanvas } from 'qrcode.react';
import { v5 as uuidv5 } from 'uuid';
import { compose } from "redux";
import { connect } from "react-redux";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import withRouter from '../../../js/withRouter';
import { 
  get_ticket_status,
  addProduct,
  cancelProduct,
  get_addProduct_gasFee,
  get_2ndHand_price,
  get_buyProduct_gasFee,
  get_cancelProduct_gasFee,
  sortArrayByMultipleKeys,
} from '../../../features/function'
import { updateAllEvents } from '../../../features/events/eventSlice';
// import MyTicketsPanel from './MyTicketsPanel'
import TicketStatus from './TicketStatus'
import SellPopup from './SellPopup'
import CancelPopup from './CancelPopup'
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

const SellSwal = withReactContent(Swal);
const CancelSwal = withReactContent(Swal);

class TicketDetail extends React.Component {
	 constructor (props) {
    super(props)

    this.state = {
      content_loading: 1,
      is_mount: false,
      ticket_detail: {},
      order_detail: {},
      marketGasFee: BigNumber.from(0),
      sellPopupShown: false,
      cancelPopupShown: false,
      newInputPrice: 0,
      fee: BigNumber.from(0),
    }

    this.load_content = this.load_content.bind(this)
    this.sellClickHandler = this.sellClickHandler.bind(this)
    this.cancelClickHandler = this.cancelClickHandler.bind(this)
    this.onPriceChange = this.onPriceChange.bind(this)
  }

  onPriceChange(event) {
    let price = $(event.target).val()
    this.setState({
      newInputPrice: price
    })
  }

  sellClickHandler() {
    SellSwal.fire({
        title: <h1 className="h1 pb-2 fw-bold border-bottom text-black">Sell Ticket</h1>,
        // html: ,
        iconColor: "#E3B04B",
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonColor: "#E3B04B",
        cancelButtonColor: "#7F786B",
        confirmButtonText: 'Confirm',
        cancelButtonText: "Cancel",
        customClass: {
            validationMessage: 'my-validation-message'
        },
        didOpen: () => this.setState({ sellPopupShown: true }),
        didClose: () => this.setState({ sellPopupShown: false }),
        // showLoaderOnConfirm: true,
        preConfirm: async () => {
            console.log(SellSwal.getConfirmButton())
            SellSwal.getConfirmButton().innerText = "Waiting for Permission..."

            let newInputPrice = ethers.utils.parseUnits(this.state.newInputPrice).toString()
            const sell_resp = await addProduct(
              this.props.ticket_id, 
              newInputPrice, 
              this.state.ticket_detail.gas,
              this.props.account_detail.wallet_accounts[0]
            )
            let error_msg = ""
            if (sell_resp.error === 0) {
                SellSwal.getConfirmButton().innerText = "Processing..."
                
                let resp = sell_resp.resp
                let trx = resp.hash
                let gasPrice = resp.gasPrice
                let gasUsed = BigNumber.from(0)
                await resp.wait().then(async (receipt) => {
                    console.log('Transaction mined:', receipt);
        
                    if (receipt.status === 0) {
                      console.log('Transaction failed.');
                      error_msg = 'Error occurred while the order was mining. Please contact Admin.'
                    } else if (receipt.status === 1) {
                      console.log('Transaction succeeded.');
        
                      gasUsed = receipt.gasUsed
                      let totalFee = gasPrice.mul(gasUsed)

                      // update hash to Seats table (and Orders?)
                      let update_req = {
                        in_marketplace: (new Date()).toISOString(), 
                        seller: this.props.account_detail.wallet_accounts[0]
                      }
                      console.time("update seat api");
                      const update_ticket_status_resp = await axios.post(process.env.REACT_APP_API_BASE_URL+"/seats/"+this.props.ticket_id, update_req)
                      console.timeEnd("update seat api");
                      console.log(update_ticket_status_resp)

                      let uuid_input = this.props.account_detail.wallet_accounts[0] + Date.now();
                      let order_id = uuidv5(uuid_input, uuidv5.URL);
                      let func_name = "addProduct";
                      let create_req = {
                        order_id : order_id,
                        buyer : this.props.account_detail.wallet_accounts[0],
                        func_name : func_name,
                        price : 0,
                        fee : totalFee.toString(),
                        ticket_id : [this.props.ticket_id],
                        executed_date : (new Date()).toISOString(),
                      }
                      console.time("create order api");
                      const creat_order_resp = await axios.post(process.env.REACT_APP_API_BASE_URL+"/orders", create_req)
                      console.timeEnd("create order api");
                      console.log(creat_order_resp)

                    }
                  });
            } else {
                error_msg = sell_resp.msg
                // if (error_msg === "Purchase is cancelled. Please try again.") {
                //     error_msg = "Redeem process is cancelled. Please try again."
                // }
            }

            if (error_msg !== "") {
                SellSwal.getConfirmButton().innerText = "Confirm"
                SellSwal.showValidationMessage(
                    "<span>" + error_msg + "</span>"
                )
            }
        },
        allowOutsideClick: () => !SellSwal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            SellSwal.fire('Ticket Listing Success!', '', 'success')
            window.location.reload()
        }
    });
    
  }

  cancelClickHandler() {
    CancelSwal.fire({
        title: <h1 className="h1 pb-2 fw-bold border-bottom text-black">Cancel Sale</h1>,
        // html: ,
        iconColor: "#E3B04B",
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonColor: "#E3B04B",
        cancelButtonColor: "#7F786B",
        confirmButtonText: 'Confirm',
        cancelButtonText: "Cancel",
        customClass: {
            validationMessage: 'my-validation-message'
        },
        didOpen: () => this.setState({ cancelPopupShown: true }),
        didClose: () => this.setState({ cancelPopupShown: false }),
        // showLoaderOnConfirm: true,
        preConfirm: async () => {
            console.log(CancelSwal.getConfirmButton())
            CancelSwal.getConfirmButton().innerText = "Waiting for Permission..."


            const cancel_resp = await cancelProduct(
              this.props.ticket_id, 
              this.props.account_detail.wallet_accounts[0]
            )
            let error_msg = ""
            if (cancel_resp.error === 0) {
                CancelSwal.getConfirmButton().innerText = "Processing..."
                
                let resp = cancel_resp.resp
                let trx = resp.hash
                let gasPrice = resp.gasPrice
                let gasUsed = BigNumber.from(0)
                await resp.wait().then(async (receipt) => {
                    console.log('Transaction mined:', receipt);
        
                    if (receipt.status === 0) {
                      console.log('Transaction failed.');
                      error_msg = 'Error occurred while the order was mining. Please contact Admin.'
                    } else if (receipt.status === 1) {
                      console.log('Transaction succeeded.');
        
                      gasUsed = receipt.gasUsed
                      let totalFee = gasPrice.mul(gasUsed)

                      // update hash to Seats table (and Orders?)
                      let update_req = {
                        in_marketplace: null, 
                        seller: null
                      }
                      console.time("update seat api");
                      const update_ticket_status_resp = await axios.post(process.env.REACT_APP_API_BASE_URL+"/seats/"+this.props.ticket_id, update_req)
                      console.timeEnd("update seat api");
                      console.log(update_ticket_status_resp)

                      let uuid_input = this.props.account_detail.wallet_accounts[0] + Date.now();
                      let order_id = uuidv5(uuid_input, uuidv5.URL);
                      let func_name = "cancelProduct";
                      let create_req = {
                        order_id : order_id,
                        buyer : this.props.account_detail.wallet_accounts[0],
                        func_name : func_name,
                        price : 0,
                        fee : totalFee.toString(),
                        ticket_id : [this.props.ticket_id],
                        executed_date : (new Date()).toISOString(),
                      }
                      console.time("create order api");
                      const creat_order_resp = await axios.post(process.env.REACT_APP_API_BASE_URL+"/orders", create_req)
                      console.timeEnd("create order api");
                      console.log(creat_order_resp)
                    }
                  });
            } else {
                error_msg = cancel_resp.msg
                // if (error_msg === "Purchase is cancelled. Please try again.") {
                //     error_msg = "Redeem process is cancelled. Please try again."
                // }
            }

            if (error_msg !== "") {
                CancelSwal.getConfirmButton().innerText = "Confirm"
                CancelSwal.showValidationMessage(
                    "<span>" + error_msg + "</span>"
                )
            }
        },
        allowOutsideClick: () => !CancelSwal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            CancelSwal.fire('Cancel Sale Success!', '', 'success')
            window.location.reload()
        }
    });
    
  }

  async load_content() {
    this.setState({
      content_loading: 1,
    })

    // if ticket > 0 and is_owner then show else redirect to 404
    console.time("get ticket_id " + this.props.ticket_id + " api")
    let get_ticket_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/seats/" + this.props.ticket_id)
    console.timeEnd("get ticket_id " + this.props.ticket_id + " api")
    console.log(get_ticket_resp)

    if (get_ticket_resp.data.length <= 0 || get_ticket_resp.data[0]['owner'] === null || this.props.account_detail.wallet_accounts.length === 0) {
      this.props.navigate('/404')
    } else if (get_ticket_resp.data[0]['owner'].toLowerCase() !== this.props.account_detail.wallet_accounts[0].toLowerCase()) {
      this.props.navigate('/404')
    } else {
      let ticket_detail = get_ticket_resp.data[0]

      
      if (!Object.keys(this.props.events.all_events).includes(ticket_detail.event_id.toString())) {
        const get_event_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/"+ticket_detail.event_id)
        let event_detail = get_event_resp.data
        await this.props.dispatch(updateAllEvents(event_detail))
      }

      let order_detail = {}
      const get_order_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/orders?ticket_id="+ticket_detail.ticket_id+"&buver="+this.props.account_detail.wallet_accounts[0]+"&is_removed=false")
      let filtered_orders = []
      for (let order of get_order_resp.data) {
        if (order.transaction !== null) {
          filtered_orders.push(order)
        }
      }
      if (filtered_orders.length > 0) {
        let sorted_orders = sortArrayByMultipleKeys(filtered_orders, ["created_date"], ["created_date"], [1])
        order_detail = sorted_orders[0]
      }
      

      let ticket_status = get_ticket_status(ticket_detail, this.props.events.all_events[ticket_detail.event_id])
      ticket_detail["ticket_status"] = ticket_status

      let fee = BigNumber.from(0)
      let market_price = BigNumber.from(0)
      let marketGas = BigNumber.from(0)
      if (ticket_status === "active") {
        fee = await get_addProduct_gasFee(
          this.props.ticket_id, 
          ticket_detail.price, 
          ticket_detail.gas,
          this.props.account_detail.wallet_accounts[0]
        )
      } else if (ticket_status === "on-sale") {
        fee = await get_cancelProduct_gasFee(
          this.props.ticket_id,
          this.props.account_detail.wallet_accounts[0]
        )
        let {price: this_price} = await get_2ndHand_price(this.props.ticket_id)
        market_price = this_price
        let fee = get_buyProduct_gasFee(this.props.ticket_id, this_price, process.env.REACT_APP_GETGAS_ACCOUNT)
        marketGas = fee
      }
      console.log(order_detail)
      let paid_price = BigNumber.from(order_detail.price)
      let paid_fee = BigNumber.from(order_detail.fee)
      let price = paid_price.add(paid_fee)


      let market_fee = BigNumber.from(marketGas)
      let total_market_price = market_price.add(market_fee)

      ticket_detail["price"] = price._hex
      ticket_detail["market_price"] = total_market_price._hex

      

      this.setState({
        content_loading: 0,
        ticket_detail: ticket_detail,
        order_detail: order_detail,
        marketGasFee: marketGas,
        fee: fee,
      }) 
    }
  
  }

  componentDidMount() {
    this.setState({
      is_mount: true,
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if ( prevState.is_mount !== this.state.is_mount ) {
      this.load_content()
    }

    if (
      prevProps.account_detail.wallet_accounts !== this.props.account_detail.wallet_accounts
    ) {
      this.load_content()
    }
  }

  render () {
    if (this.state.content_loading === 1) {
      return (
        <div className="row" style={{'height': '100%'}}>
          {/*<img src={require('../../img/loading-black.gif')} />*/}
          <img className="loading-black" style={this.props.style.loading_size_profile}/>
        </div>
      )
    } else {
      let event_detail = this.props.events.all_events[this.state.ticket_detail.event_id]
      let show_datetime_event = formatInTimeZone(new Date(event_detail.date_sell), this.props.account_detail.timezone, 'iiii d MMMM yyyy, HH:mm')
      let seat_id = this.state.ticket_detail.seat_row + this.state.ticket_detail.seat_id
      let price = parseFloat(ethers.utils.formatEther(this.state.ticket_detail.price)).toFixed(4)
      let market_price = parseFloat(ethers.utils.formatEther(this.state.ticket_detail.market_price)).toFixed(4)
      let ticket_status = this.state.ticket_detail.ticket_status
      let imgurl = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/" + event_detail.event_id + ".png"
      let snowtrace_link = "https://testnet.snowtrace.io/nft/"+ process.env.REACT_APP_TICKET_ADDRESS +"/"+ this.props.ticket_id +"?chainId=43113"
      let tooltip = "see your ticket on Blockchain"

      return (
        <div className="row">
          <div className="col account-page ticket-tab">
            <div className="row justify-content-center">
              <div className="col-sm-11 header">
                <div className="row align-items-center">
                    <div className="col pt-4 text-start ">
                        <h3 className="fw-bold">Ticket #{this.props.ticket_id}</h3>
                    </div>
                    <div className="col-sm-2">
                        <TicketStatus status={ticket_status} />
                    </div>
                </div>
              </div>
            </div>
            <div className="row justify-content-center">
                <div className="py-3 col-sm-11 content">
                    <div className="row event-detail pb-4">
                        <div className="col-sm-2" style={{width: "20.75%"}}>
                        <img src={imgurl} style={{width: '8em', minHeight: '100%'}}/> 
                        </div>
                        <div className="col text-start">
                        <h5 className="h3 fw-bold">{event_detail.event_name}</h5>
                        <div className="row justify-content-center">
                            <ul className="col m-0">
                            <li className="row py-1 date-event">
                                <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarDays} /></div>
                                <div className="col-sm-11 fw-bold">
                                {show_datetime_event}
                                </div>
                            </li>
                            <li className="row py-1 venue">
                                <div className="col-sm-1"><FontAwesomeIcon icon={faLocationDot} /></div>
                                <div className="col-sm-11 fw-bold">
                                {event_detail.venue}
                                </div>
                            </li>
                            </ul>
                        </div>
                        
                        </div>
                        <div className="col-sm-2 text-center">
                          {
                            (["past", "used"].includes(ticket_status)) ? (
                              []
                            ) : (
                              [
                                <QRCodeCanvas value={snowtrace_link} />,
                                <span className="fw-bold qr-label">Zone {this.state.ticket_detail.zone} - {seat_id}</span>
                              ]
                            )
                          }
                        </div>
                    </div>
                    <div className="row pt-4">
                        <div className="col text-center">
                            <div className="row seat-detail align-items-center">
                                <div className="col-sm-2 me-2">
                                    <div className="row">
                                        <span className="label">Zone</span>
                                    </div>
                                    <div className="row">
                                        <span className="value">{this.state.ticket_detail.zone}</span>
                                    </div>
                                </div>
                                <div className="col-sm-2 mx-2">
                                    <div className="row">
                                        <span className="label">Seat</span>
                                    </div>
                                    <div className="row">
                                        <span className="value">{seat_id}</span>
                                    </div>
                                </div>
                                <div className="col">

                                </div>
                                {
                                  (ticket_status === "on-sale") ? (
                                    <div className="col-sm-2">
                                      <div className="row align-items-center">
                                        <div className="col-6 p-0 text-start">
                                          <span className="label">Your Price</span>
                                        </div>
                                        <div className="col-6 p-0 text-start">
                                          <span className="ms-2 value">{market_price}</span>
                                        </div>
                                      </div>
                                      <div className="row align-items-center">
                                        <div className="col-6 p-0 text-start">
                                          <span className="ori-price">Original Price</span>
                                        </div>
                                        <div className="col-6 p-0">
                                          <span className="ms-2 ori-price">{price}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="col-sm-2">
                                      <span className="label">Price</span>
                                      <span className="ms-2 value">{price}</span>
                                    </div>
                                  )
                                }
                                <div className="col-sm-2">
                                    {
                                      (ticket_status === "on-sale") ? (
                                        <button type="button" className="btn btn-warning fw-bold" onClick={this.cancelClickHandler}>Cancel Sale</button>
                                      ) : (["past", "used"].includes(ticket_status)) ? (
                                        []
                                      ) : (
                                        <button type="button" className="btn btn-warning fw-bold" onClick={this.sellClickHandler}>Sell Ticket</button>
                                      )
                                    }
                                </div>
                            </div>
                            <div className="row py-3">
                                <a className="" target="_blank" href={snowtrace_link} rel="noreferrer" title={tooltip}>
                                    <div className="col-sm-4 text-start">
                                      <img src={require('../../../img/snowtrace-icon.png')} style={{height: '1em'}}/>
                                      <span className="ms-1">see detail at snowtrace.io</span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <SellPopup 
              ticket_detail={this.state.ticket_detail} 
              fee={this.state.fee} 
              PopupSwal={SellSwal} 
              popupShown={this.state.sellPopupShown}
              onPriceChange={this.onPriceChange}
            />
            <CancelPopup 
              ticket_detail={this.state.ticket_detail} 
              fee={this.state.fee} 
              PopupSwal={CancelSwal} 
              popupShown={this.state.cancelPopupShown}
            />
          </div>
        </div>
      )
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    account_detail: state.account,
    purchase: state.purchase,
    events: state.events,
    style: state.style,
    ticket_id: ownProps.params.ticket_id,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(TicketDetail);