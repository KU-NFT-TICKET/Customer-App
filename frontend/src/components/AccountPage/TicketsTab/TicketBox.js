import React from 'react'
import $ from 'jquery';
import axios from "axios"
import parseISO from 'date-fns/parseISO';
import { BigNumber, ethers } from 'ethers'
import { BrowserRouter, Link } from 'react-router-dom'
import { connect } from "react-redux";
import { compose } from "redux";
import withRouter from '../../../js/withRouter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faDollarCircle } from '@fortawesome/free-solid-svg-icons'
import { formatInTimeZone } from 'date-fns-tz';
import Swal from 'sweetalert2'
import 'bootstrap/dist/js/bootstrap.bundle';
import contractTicketPlace from '../../../contracts/TicketMarketplace.json'
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class TicketBox extends React.Component {
	 constructor (props) {
    super(props)

    this.state = {
      is_mount: false,
      ticket_status: "",
    	// trx_list: new Map(),
      // event_detail_list: {},
      // content_loading: 1,
    }

    this.sell_ticket = this.sell_ticket.bind(this)
    this.cancel_selling_ticket = this.cancel_selling_ticket.bind(this)
    this.popup_sellform = this.popup_sellform.bind(this)
    this.handleCancelSell = this.handleCancelSell.bind(this)

  }

  async sell_ticket(ticket_id, price, gas) {
    let add_product_rst = {
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
      const sell_resp = await contractMaket.addProduct(
        ticket_id, 
        price, 
        gas, 
        // { value: price }
      )
      console.log(sell_resp)
      add_product_rst['resp'] = sell_resp

    } catch (e) {
      let show_error_text = e.reason;
      if (show_error_text.includes("User denied transaction signature")) {
        show_error_text = "You cancelled the ticket selling. Please try again."
      } else if (show_error_text.includes("user rejected transaction")) {
        show_error_text = "You cancelled the ticket selling. Please try again."
      } else if (show_error_text.includes("The ticket can only be listed once")) {
        show_error_text = "Ticket is already on sell."
      } else if (show_error_text.includes("This Ticket is not for sell yet")) {
        show_error_text = "This Ticket is not for sell yet"
      } else if (show_error_text.includes("You need to pay the correct price.")) {
        show_error_text = "You need to pay the correct price."
      }
      console.log(e)
      add_product_rst['error'] = 1
      add_product_rst['msg'] = show_error_text
    }

    return add_product_rst
  }

  async cancel_selling_ticket(ticket_id) {
    let cancel_product_rst = {
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
      const cancel_resp = await contractMaket.cancelProduct(
        ticket_id
      )
      console.log(cancel_resp)
      cancel_product_rst['resp'] = cancel_resp

    } catch (e) {
      let show_error_text = e.reason;
      if (show_error_text.includes("User denied transaction signature")) {
        show_error_text = "You cancelled the ticket retrieving. Please try again."
      } else if (show_error_text.includes("user rejected transaction")) {
        show_error_text = "You cancelled the ticket retrieving. Please try again."
      } else if (show_error_text.includes("The ticket can only be listed once")) {
        show_error_text = "Ticket is already on sell."
      } else if (show_error_text.includes("This Ticket is not for sell yet")) {
        show_error_text = "This Ticket is not for sell yet"
      } else if (show_error_text.includes("You need to pay the correct price.")) {
        show_error_text = "You need to pay the correct price."
      }
      console.log(e)
      cancel_product_rst['error'] = 1
      cancel_product_rst['msg'] = show_error_text
    }

    return cancel_product_rst
  }

  async popup_sellform() {
    // let ticket_id = $(event.target).val()
    // let original_price = $(event.target).attr( "ori_price" )
    // let gas = $(event.target).attr( "gas" )
    let ori_status = this.state.ticket_status
    let ticket_id = this.props.ticket_detail['ticket_id']
    let original_price = this.props.ticket_detail['price']
    let gas = this.props.ticket_detail['gas']
    let original_avax_price = ethers.utils.formatEther(original_price)

    console.log("sell ticket = " + ticket_id)
    console.log("ori price = " + original_price)

    await Swal.fire({
    // const { value: formValues } = await Swal.fire({
      title: 'Setting Price', 
      html: '<form style="text-align: left;">' +
      '<div class="mb-3">' +
      '<label for="price" class="form-label" >Price</label>' +
      '<input type="text" class="form-control price-form" id="new_price" name="price" placeholder="' + original_avax_price + '" >' +
      '</div>' +
      '</form>',
      focusConfirm: false,
      showLoaderOnConfirm: true,
      // loaderHtml: '<span class="loading-text popup-loader">WAITING FOR PERMISSION</span>',
      confirmButtonText: 'Set Price',
      confirmButtonColor: '#ffcc00',
      customClass: {
        // loader: 'custom-loader',
        validationMessage: 'my-validation-message'
      },
      // width: '80%',
      preConfirm: async () => {
        // return {err: 0, msg: "Your ticket has been added to Marketplace."}

        console.time('update in_marketplace and insert order');
        let new_avax_price = $(".price-form[name=price]").val().trim()
        console.log("new_avax_price = " + new_avax_price)
        let new_price = ethers.utils.parseUnits(new_avax_price).toString()
        console.log("new_price = " + new_price)
        
        this.setState({
          ticket_status: "WAITING FOR PERMISSION",
        })

        let sell_resp = await this.sell_ticket(ticket_id, new_price, gas)
        // let sell_resp = {'error': 0, 'msg': ''}
        console.log(sell_resp)

        let rst = {err: 1, title: 'Error', msg: ''}
        if (sell_resp['error'] == 0) {

          this.setState({
            ticket_status: "LOADING",
          })

          let resp = sell_resp['resp']
          await resp.wait().then(async (receipt) => {
            console.log('Transaction mined:', receipt);
            if (receipt.status === 0) {
              console.log('Transaction failed');
              rst = {
                err: 1, 
                title: 'Please contact Admin.',
                msg: 'Error occured when the order was mining.',
              }
            } else if (receipt.status === 1) {
              console.log('Transaction succeeded');

              let update_bind = {
                ticket_id: ticket_id,
                in_marketplace: (new Date()).toISOString(),
                seller: this.props.account_detail.wallet_accounts[0],
              }
              console.log(update_bind)
              await axios.post(process.env.REACT_APP_API_BASE_URL+"/seats/" + ticket_id, update_bind)
                .then( async (response) => {
                    // Success
                  console.log("update ticket detail.")
                  console.log(response)
                  // return {err: 0, msg: "Your ticket has been added to Marketplace."}
                  rst = {err: 0, msg: "Your ticket has been added to Marketplace."}
                })
                .catch( async (error) => {
                  console.log("sell success but update failed.")
                  console.log(error)

                  let msg = error.message
                  if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                  } else if (error.request) {
                    // The request was made but no response was received
                    console.log(error.request);
                  } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Error', error.message);
                  }

                  rst = {
                    err: 1, 
                    title: 'The ticket was added to Marketplace, but cannot update data. Please Contact admin.',
                    msg: msg,
                  }

                  // Error
                  // return {err: 1, msg: "Add ticket to Marketplace success. But cannot update data. Please Contact admin."}
              });
            }
          });
          
        } else {
          rst =  {err: 1, title: sell_resp['msg'], msg: ''}
        }

        if (rst['err'] !== 0) {
          console.log(this.state.ticket_status)
          this.setState({
            ticket_status: ori_status,
          })
        }

        return rst
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then(async (result) => {
      console.log(result)
      if (result.isConfirmed) {
        if (result.value.err === 0) {
          Swal.fire('Sent to Marketplace: success', '', 'success')
          this.props.load_tickets()

        } else {
          Swal.fire(result.value.title, result.value.msg, 'error')
        }
      }
    })

    // console.log(formValues);
    // if (formValues !== null) {
    //   console.log("final fire");
      
    //   Swal.fire(JSON.stringify(formValues))
    // }

    // addProduct then update in_marketplace and insert order (orderid, transaction, )
  }

  async handleCancelSell() {
    let ticket_id = this.props.ticket_detail['ticket_id']
    await Swal.fire({
      title: "Cancel your selling?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      showLoaderOnConfirm: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, I want cancel!",
      preConfirm: async () => {
        let cancel_resp = await this.cancel_selling_ticket(ticket_id)
        // let cancel_resp = {'error': 0, 'msg': ''}
        console.log(cancel_resp)

        if (cancel_resp['error'] == 0) {

          this.setState({
            ticket_status: "LOADING",
          })

          let resp = cancel_resp['resp']
          let rst = {err: 1, title: 'Error', msg: ''}
          await resp.wait().then(async (receipt) => {
            console.log('Transaction mined:', receipt);
            if (receipt.status === 0) {
              console.log('Transaction failed');
              rst = {
                err: 1, 
                title: 'Please contact Admin.',
                msg: 'Error occured when the order was mining.',
              }
            } else if (receipt.status === 1) {
              console.log('Transaction succeeded');

              let update_bind = {
                ticket_id: ticket_id,
                in_marketplace: null,
                seller: null,
              }
              console.log(update_bind)
              await axios.post(process.env.REACT_APP_API_BASE_URL+"/seats/" + ticket_id, update_bind)
                .then( async (response) => {
                    // Success
                  console.log("update ticket detail.")
                  console.log(response)
                  // return {err: 0, msg: "Your ticket has been added to Marketplace."}
                  rst = {err: 0, msg: 'Your ticket has been removed from Marketplace.'}
                })
                .catch( async (error) => {
                  console.log("The ticket has been removed from Marketplace. but update failed.")
                  console.log(error)

                  let msg = error.message
                  if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                  } else if (error.request) {
                    // The request was made but no response was received
                    console.log(error.request);
                  } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Error', error.message);
                  }

                  rst = {
                    err: 1, 
                    title: 'The ticket was removed from Marketplace, but cannot update data. Please Contact admin.',
                    msg: msg,
                  }

                  // Error
                  // return {err: 1, msg: "Add ticket to Marketplace success. But cannot update data. Please Contact admin."}
              });
            }
          });
          
          return rst
        } else {
          return {err: 1, title: cancel_resp['msg'], msg: ''}
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
    }).then(async (result) => {
      console.log(result)
      if (result.isConfirmed) {
        if (result.value.err === 0) {
          Swal.fire({
            title: "Cancelled!",
            text: "Your Ticket has been returned.",
            icon: "success"
          });
          this.props.load_tickets()
        } else {
          Swal.fire(result.value.title, result.value.msg, 'error')
        }
      } 
    })
  }

  componentDidMount() {
    this.setState({
      is_mount: true,
    })

  }

  componentDidUpdate(prevProps, prevState) {

    if ( prevState.is_mount !== this.state.is_mount ) {

    }

  }

  render () {
    let event_detail = this.props.events.all_events[this.props.ticket_detail.event_id]
    let imgurl = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/" + event_detail.event_id + ".png"

    let seat_id = this.props.ticket_detail['seat_row'] + this.props.ticket_detail['seat_id']
    let show_datetime_event = formatInTimeZone(new Date(event_detail.date_event), this.props.account_detail.timezone, 'iiii d MMMM yyyy HH:mm')
    let price = ethers.utils.formatEther(this.props.ticket_detail['price'])
    // console.log(this.props.ticket_detail) 
    let market_price = ethers.utils.formatEther(this.props.ticket_detail['market_price'])

    return (
      
      <div className="row my-2">
        <div className=" py-3 col ticket-box">
          <div className="row">
            <div className="col-sm-2" style={{width: "20.75%"}}>
              <img src={imgurl} style={{width: '8em', minHeight: '100%'}}/> 
            </div>
            <div className="col text-start">
              <h5 className="col fw-bold">{event_detail.event_name}</h5>
              <div className="row">
                <ul className="col">
                <li className="row py-1">
                    <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarDays} /></div>
                    <div className="col-sm-11 fw-bold">
                      {show_datetime_event}
                    </div>
                </li>
                <li className="row">
                    <div className="col-sm-1"><FontAwesomeIcon icon={faLocationDot} /></div>
                    <div className="col-sm-11 fw-bold">
                      {event_detail.venue}
                    </div>
                </li>
                </ul>
              </div>
              <div className="row">
                <div className="col-sm-8 pt-1 text-center seat-detail">
                  <div className="row">
                    <div className="col-sm-2 me-2">
                      <div className="row">
                        <span className="label">Zone</span>
                      </div>
                      <div className="row">
                        <span className="value">{this.props.ticket_detail['zone']}</span>
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
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-2">
              <Link to={"/account/tickets/"+this.props.ticket_detail.ticket_id} >
                <button type="button" className="btn btn-warning fw-bold ticket-view" >View Detail</button>
              </Link>
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
  ticket_detail: ownProps.ticket_detail,
  load_tickets: ownProps.load_tickets,
});

export default compose(
  withRouter,
  connect(mapStateToProps)
)(TicketBox);