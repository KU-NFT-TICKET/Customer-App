import React from 'react'
import $ from 'jquery';
import axios from "axios"
import Swal from 'sweetalert2'
import HtmlTooltip from '@mui/material/Tooltip';
import { BigNumber, ethers } from 'ethers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle, faCalendarDays, faLocationDot, faClock, faCalendarPlus, faCircleDollarToSlot, faTicket } from '@fortawesome/free-solid-svg-icons'
import { faBan } from '@fortawesome/free-solid-svg-icons'
import { ReactComponent as AvaxCircle } from '../../img/Avalanche_AVAX_Black.svg';
import { ReactComponent as Avax } from '../../img/avax-icon.svg';
import { v5 as uuidv5 } from 'uuid';
import { compose } from "redux";
import { connect } from "react-redux";
import withRouter from '../../js/withRouter';
import { is_ticket_available, gen_purchase_form,  } from '../../features/function'
import { 
  addSeatSelection, 
  removeSeatSelection, 
  resetSeatSelection, 
  addSeat2ndSelection, 
  removeSeat2ndSelection, 
  updateSeatDetail,
  updateSelectedZone, 
  setupPurchaseResult, 
  setOrderID, 
} from '../../features/purchase/purchaseSlice';
import BookingBox from './BookingBox'

class ZoneDetail_V2 extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
        loading: 0,
        show_resale: false,
        selectSeathtml: [],
    }

    this.seat_check = this.seat_check.bind(this)
    this.gen_selectSeat_html = this.gen_selectSeat_html.bind(this)
    this.toggle_seat_mode = this.toggle_seat_mode.bind(this)
    this.is_all_tickets_available = this.is_all_tickets_available.bind(this)
    this.get_orders_detail = this.get_orders_detail.bind(this)
    this.create_order = this.create_order.bind(this)
    this.buyTicketClickHandler = this.buyTicketClickHandler.bind(this)

    this.legendRef = React.createRef()
  }
  
  async is_all_tickets_available(ticket_list) {
    let ticket_list_str = ticket_list.join(",")
    const seats_detail = await axios.get(process.env.REACT_APP_API_BASE_URL+"/seats?ticket_id="+ticket_list_str)

    let unavailable_count = 0
    for (let seat_detail of seats_detail.data) {
      let is_available = is_ticket_available(seat_detail, true)
      console.log(seat_detail['ticket_id'] + " " + is_available)
      if (!is_available) {
        unavailable_count += 1
      }
    }

    let available_flag = false
    if (unavailable_count === 0) {
      available_flag = true
    }

    return available_flag
  }

  async get_orders_detail(event_id) {
    const my_event_orders = await axios.get(process.env.REACT_APP_API_BASE_URL+"/orders?event_id=" + event_id + "&buyer=" + this.props.account_detail.wallet_accounts[0] 
      + "&is_intime=true&is_removed=false"
    )

    let this_zone = ""
    let this_orderid = ""
    let completed_trx = 0
    let incomplete_flag = false
    let available_orders = {}
    for (let order_detail of my_event_orders.data) {
      // let seat_detail = this.props.purchase.seatDetail[this.props.purchase.selected_zone][this.props.purchase.seatSelection[0]]
      // let purchase_form = gen_purchase_form(seat_detail, this.props.purchase.eventDetail, this.props.account_detail.wallet_accounts[0], this.props.account_detail.timezone)

      // get zone
      if (this_zone === "") {
        if (order_detail["transaction"] === null) {
          this_orderid = order_detail["order_id"]
          // this.props.dispatch(setOrderID(order_detail["order_id"]))
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
        error_msg: "",
      }
    }
    if (Object.keys(available_orders).length > 0 && Object.keys(available_orders).length !== completed_trx) {
      incomplete_flag = true
      this.props.dispatch(setupPurchaseResult(available_orders))
      // this.props.dispatch(updateSelectedZone(this_zone))
      // this.props.dispatch(jumpPurchaseState(3))
    }

    return {have_incomplete: incomplete_flag, selectedZone: this_zone, order_id: this_orderid, purchase_results: available_orders}
  }

  async create_order(firsthand_tickets, secondhand_tickets, order_id) {
    let available_orders = {}
    if (firsthand_tickets.length > 0) {
      let ticket_owner = this.props.purchase.seatDetail[this.props.purchase.selected_zone][firsthand_tickets[0]]['creator'].toLowerCase()
      let price = this.props.purchase.seatDetail[this.props.purchase.selected_zone][firsthand_tickets[0]]['price']
      let order_bind = {
        order_id: order_id,
        buyer: this.props.account_detail.wallet_accounts[0],
        seller: ticket_owner,
        ticket_id: firsthand_tickets,
        price: price,
        func_name: 'createTicket',
      }

      try {
        await axios.post(process.env.REACT_APP_API_BASE_URL+"/orders", order_bind)
        .then((response) => {
            // Success
          console.log("Inserted to Table Orders.")

          for (let seat_id of firsthand_tickets) {
            let purchase_form = gen_purchase_form(
              this.props.purchase.seatDetail[this.props.purchase.selected_zone][seat_id], 
              this.props.events.all_events[this.props.event_id], 
              this.props.account_detail.wallet_accounts[0],
              this.props.account_detail.timezone
            )
            console.log(seat_id)
            available_orders[seat_id] = {
              result: "", 
              seller: ticket_owner, 
              transaction: null,
              purchase_form: purchase_form
            }
          }
        })
      } catch (error) {
        throw error
      }
    }

    if (secondhand_tickets.length > 0) {

      let promises = []
      for (let sec_id of secondhand_tickets) {
        let ticket_owner = this.props.purchase.seatDetail[this.props.purchase.selected_zone][sec_id]['owner'].toLowerCase()
        let price = this.props.purchase.marketplace_prices[sec_id]
        let order_bind = {
          order_id: order_id,
          buyer: this.props.account_detail.wallet_accounts[0],
          seller: ticket_owner,
          ticket_id: [sec_id],
          price: price,
          func_name: 'buyProduct',
        }

        let insert_promise = axios.post(process.env.REACT_APP_API_BASE_URL+"/orders", order_bind)
        .then((response) => {
            // Success
          console.log("Inserted to Table Orders.")

          available_orders[sec_id] = {
            result: "", 
            seller: ticket_owner, 
            transaction: null,
            purchase_form: null
          }
        })
        promises.push(insert_promise)
      }

      try {
        let results = await Promise.all(promises);
        console.log(results);
      } catch (error) {
        throw error
      }
    }
    return available_orders
  }

  async buyTicketClickHandler() {
    console.log('buy handle')

    // check if any select seat
    if (this.props.purchase.seatSelection.length > 0) {
      
      this.setState({
         loading: 1,
      });

      // search for incompleted orders
      let {
        'have_incomplete': have_incomplete_order, 
        'selectedZone': prev_selectedZone,
        'order_id': prev_orderid,
        'purchase_results': prev_purchaseResults,
      } = await this.get_orders_detail(this.props.event_id)

      if (have_incomplete_order) {
        console.log("here!")

        let prev_selectedSeats = [...Object.keys(prev_purchaseResults)].sort()
        let prev_seat_no = []
        for (let p_id of prev_selectedSeats) {
          let this_seatDetail = this.props.purchase.seatDetail[prev_selectedZone][p_id]
          prev_seat_no.push(this_seatDetail["seat_row"] + this_seatDetail["seat_id"])
        }
        await Swal.fire({
          title: "Your previous order is incomplete.",
          html: '<p>Do you want to continue your previous order?</p>' +
          '<div class="prev-order">' +
          '<small class="order">Order#' + prev_orderid + '</small>' + 
          '<h3 class="zone">Zone ' + prev_selectedZone + '</h3>' + 
          '<h5 class="seat">Seat no. ' + prev_seat_no.join(', ') + '</h5>' + 
          '</div>',
          showDenyButton: true,
          confirmButtonColor: "#E3B04B",
          denyButtonColor: "#7F786B",
          confirmButtonText: "Continue this order",
          denyButtonText: "Cancel and Create new order",
          reverseButtons: true,
          // allowOutsideClick: false,
          // allowEscapeKey: false,
        }).then(async (result) => {
          if (result.isConfirmed) {
            console.log('continue old order')

            // set selectSeat from prev order
            await this.props.dispatch(resetSeatSelection())
            for (let ticket_id of Object.keys(prev_purchaseResults)) {
              await this.props.dispatch(addSeatSelection(ticket_id))
            }
            
            await this.props.dispatch(setOrderID(prev_orderid))
            await this.props.dispatch(updateSelectedZone(prev_selectedZone))
            await this.props.dispatch(setupPurchaseResult(prev_purchaseResults))
            this.props.navigate('/purchase/' + this.props.purchase.order_id)
          } else if (result.isDenied) {
            console.log('cancel old order')
            const cancel_resp = await axios.delete(process.env.REACT_APP_API_BASE_URL+"/orders/"+prev_orderid)
            console.log(cancel_resp)
            have_incomplete_order = false
          }
        });
      } 
      
      if (!have_incomplete_order) {
        // // check availablity
        let ticket_list = this.props.purchase.seatSelection

        let is_available = false
        try {
          is_available = this.is_all_tickets_available(ticket_list)
        } catch (get_seat_err) {
          this.setState({
            loading: 0,
          });
          console.error(get_seat_err)
          Swal.fire('Please contact Admin.', 'Error: cannot check seat availability', 'error')
          return
        }

        if (is_available) {
          let firsthand_tickets = this.props.purchase.seatSelection.filter(x => !this.props.purchase.seat2ndSelection.includes(x))
          let secondhand_tickets = this.props.purchase.seat2ndSelection
          
          let uuid_input = this.props.account_detail.wallet_accounts[0] + Date.now()
          let order_id = uuidv5(uuid_input, uuidv5.URL);
          console.log(order_id)
          
          let available_orders = {}
          try {
            // create order
            available_orders = await this.create_order(
              firsthand_tickets, 
              secondhand_tickets,
              order_id,
            )
          } catch (create_order_err) {
            this.setState({
                loading: 0,
            });
            console.error(create_order_err)
            Swal.fire('Please contact Admin.', 'Error: cannot create order', 'error')
            return
          }

          this.props.dispatch(setOrderID(order_id))
          this.props.dispatch(setupPurchaseResult(available_orders))

          this.setState({
            loading: 0,
          });
          this.props.navigate('/purchase/'+order_id)
          
        } else {
          this.setState({
              loading: 0,
          });
          Swal.fire({
            title: 'Some of your seats are unavailable.',
            // text: "You won't be able to revert this! ⚠️",
            icon: 'error',
            // iconColor: '#D06421',
          }).then(async function() {
            this.setState({ loading: 1 });
            await this.gen_selectSeat_html()
            this.setState({ loading: 0 });
          });
        }
      }
      
    } else {
      this.setState({
         loading: 0,
      });
      Swal.fire({
        title: 'Please select seat(s).',
        icon: 'warning',
        iconColor: '#D06421',
      })
    }
  }

  toggle_seat_mode(event) {
    let is_ck = $(event.target).is(':checked')
    console.log(is_ck)
    this.setState({
        show_resale: is_ck,
    })
    // let second_hand
    let in_mkp_ban = "label[in_marketplace='Y'] svg"
    let in_mkp_checkbox = "input.seat-check[in_marketplace='Y']"
    let in_mkp_seatno = "label[in_marketplace='Y'] div.label-seat"

    let not_in_mkp_ban = "label:not([in_marketplace]) svg, label[in_marketplace!='Y'] svg"
    let not_in_mkp_checkbox = "input.seat-check:not([in_marketplace]), input.seat-check[in_marketplace!='Y']"
    let not_in_mkp_seatno = "label.seat-check:not([in_marketplace]) div.label-seat, label.seat-check[in_marketplace!='Y'] div.label-seat"

    if (is_ck) {
      $(".resale-legend").show()

      $(in_mkp_ban).hide()
      $(in_mkp_seatno).show()
      $(in_mkp_checkbox).prop('disabled', false)
    } else {
      $(".resale-legend").hide()

      $(in_mkp_ban).show()
      $(in_mkp_seatno).hide();
      $(in_mkp_checkbox).prop('disabled', false)
      // $("input.seat-check[in_marketplace='Y']").prop('checked', false)

      // $("label div.label-seat").hide();
      let available_seatno = $("label div.label-seat").filter(function() {
          return $(this).siblings("svg").css("display") === "none";
      });
      available_seatno.show()
      $("label img").hide()
      $("input.seat-check").prop('checked', false)
      this.props.dispatch(resetSeatSelection())
    }
  }

  async gen_selectSeat_html() {
    var ticket_detail = []
    var selectSeathtml = []

    this.props.dispatch(resetSeatSelection())
    this.setState({
      selectSeathtml: [],
    })

    try {
      const ownTickett = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + this.props.event_id + "/seats?zone=" + this.props.selectedZone)
      ticket_detail = ownTickett.data

      let {seat_list: formatted_ticket_list} = await this.props.transform_seat_data(ticket_detail)

      await this.props.dispatch(updateSeatDetail(formatted_ticket_list))

      console.log(ticket_detail)
      var z = this.props.selectedZone
      var s = ''
      var head = []
      var row = []
      var body = []
      var col = []
      var key = {}
      for (var i = 0; i < ticket_detail.length; i++) {
        if (s !== ticket_detail[i].seat_row) {
          if (s !== '') {
            row.push((<tr zone={z}><td>{s}</td>{col}<td>{s}</td></tr>))
            // row.push((<tr zone={z}><td>{z + s}</td>{col}<td>{z + s}</td></tr>))
            col = []
          }
          s = ticket_detail[i].seat_row
        }
        var s_id = z + '' + s + '' + ticket_detail[i].ticket_id
        var l_id = 'key:' + z + '' + s + '' + ticket_detail[i].ticket_id
        key[ticket_detail[i].ticket_id] = { id: z + '' + s + '' + ticket_detail[i].seat_id, zone: z }
        var disabled = ''
        // var display_div = { 'display': 'none' }
        var display_div = {}
        var display_img = { 'display': 'none' }
        var display_ban = { 'display': 'none' , 'margin': '0px 3px'}
        var seat_color = 'available'
        var in_marketplace = 'N'
        var checked = false
        // console.log(ticket_detail[i].seat_row + ticket_detail[i].seat_id)
        // console.log(is_ticket_available(ticket_detail[i]))
        let price = "0"
        let diff_price = "0"
        if (!is_ticket_available(ticket_detail[i])) {
          disabled = 'disabled'
          display_div = { 'display': 'none' }
          display_ban = { 'margin': '0px 3px'}
        } 
        if (ticket_detail[i].in_marketplace !== null && is_ticket_available(ticket_detail[i], true)) {
          in_marketplace = 'Y'
          let seat_color = 'second-hand-normal'
          let avax_color = 'avax-primary'
          price = BigNumber.from(this.props.purchase.marketplace_prices[ticket_detail[i].ticket_id])
          let original_price = BigNumber.from(ticket_detail[i].price)
          diff_price = price.sub(original_price)
          console.log(diff_price.toString(), original_price.toString())
          if (diff_price.gte(original_price)) {
            seat_color = 'second-hand-high'
            avax_color = 'avax-alert'
          }

          // let shown_diff_price = ethers.utils.formatEther(diff_price)
          let shown_diff_price = parseFloat(ethers.utils.formatEther(diff_price)).toFixed(2)
          let shown_price = parseFloat(ethers.utils.formatEther(price)).toFixed(2)
          if (diff_price.gt(0)) {
            shown_diff_price = "+" + shown_diff_price
          } else if (diff_price.lt(0)) {
            shown_diff_price = "-" + shown_diff_price
          }
          
          col.push((<td>
          <input className="seat-check" defaultChecked={checked} disabled={disabled} onChange={this.seat_check} name="seat" type="checkbox" id={s_id} value={ticket_detail[i].ticket_id} in_marketplace={in_marketplace} />
            <HtmlTooltip
              placement="top"
              title={
                <div className="seat-tooltip">
                  <div className="row">
                    <div className="col text-end">
                      <Avax className={avax_color + " mb-1"} style={{width: "1em", height: "1em"}} />
                      <span className={"ms-1 h6 fw-bold " + seat_color}>{shown_diff_price}</span>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col text-end">
                      <span className="me-2 color-light-gray">Price</span>
                      <Avax className="avax-light-gray "  style={{width: "0.9em", height: "0.9em", marginBottom: "0.2em"}}/>
                      <span className="ms-1  fw-bold color-light-gray">{shown_price}</span>
                    </div>
                  </div>
                </div>
              }
            >
              <label id={l_id} htmlFor={s_id} in_marketplace={in_marketplace} style={{ 'padding' : 0 }} >
                <div className={"label-seat " + seat_color} style={display_div}>{ticket_detail[i].seat_id}</div>
                <FontAwesomeIcon icon={faBan} size="xl" style={display_ban} />
                <img className="label-seat seat-img-check" src={require('../../img/Sign-check-icon.png')} style={display_img} />
              </label>
            </HtmlTooltip>
          </td>))


        } else {
          col.push((<td>
            <input className="seat-check" defaultChecked={checked} disabled={disabled} onChange={this.seat_check} name="seat" type="checkbox" id={s_id} value={ticket_detail[i].ticket_id} in_marketplace={in_marketplace} />
            <label id={l_id} htmlFor={s_id} in_marketplace={in_marketplace} style={{ 'padding' : 0 }} >
              <div className={"label-seat " + seat_color} style={display_div}>{ticket_detail[i].seat_id}</div>
              <FontAwesomeIcon icon={faBan} size="xl" style={display_ban} />
              <img className="label-seat seat-img-check" src={require('../../img/Sign-check-icon.png')} style={display_img} />
            </label>
          </td>))
        }
        
      }
      row.push((<tr zone={z}><td>{s}</td>{col}<td>{s}</td></tr>))
      // row.push((<tr zone={z}><td>{z + s}</td>{col}<td>{z + s}</td></tr>))
      body.push((<div className={"scrollbar"} style={{ 'height': '300px' }} id={z}>
                  <table className="table table-borderless tableseat">
                    {row}
                  </table>
                </div>))
      selectSeathtml.push(
        <div className="tab-content bg-black" id="pills-tabContent">
          {body}
        </div>
      )
    } catch (err) {
      console.log(err)
    }

    this.setState({
      selectSeathtml: selectSeathtml,
    })

    this.legendRef.current.scrollIntoView()
  }

  seat_check(event) {
    var is_ck = $(event.target).is(':checked')
    let ticket_id = $(event.target).val()
    console.log(is_ck)
    let seat_limit = this.props.events.all_events[this.props.event_id]["purchase_limit"]
    let selected_seat_detail = this.props.purchase.seatDetail[this.props.selectedZone][ticket_id]
    let in_marketplace = false

    if (selected_seat_detail["in_marketplace"] !== null) {
      in_marketplace = true
    }

    if (is_ck) {
      if (this.props.purchase.seatSelection.length >= seat_limit) {
        $(event.target).prop('checked', false)
        Swal.fire('Selected item(s) exceed purchase limit.', '', 'warning')
      } else { 
        // if (this.props.purchase.seatSelection.length > 0 && !is_beside_ticket(selected_seat_detail, this.props.purchase.selected_seat_row, this.props.purchase.min_selected_seatID, this.props.purchase.max_selected_seatID)) {
        //   $(event.target).prop('checked', false)
        //   Swal.fire('You can only select the seat beside each other.', '', 'warning')
        // } else {
          $(event.target).parent().children("label").children("div").hide()
          $(event.target).parent().children("label").children("img").show()
          this.props.dispatch(addSeatSelection(ticket_id))
          if (in_marketplace) {
            this.props.dispatch(addSeat2ndSelection(ticket_id))
          }
        // }
      }
    } else {
      // if (selected_seat_detail["seat_id"] != this.props.purchase.min_selected_seatID && selected_seat_detail["seat_id"] != this.props.purchase.max_selected_seatID) {
      //   $(event.target).prop('checked', true)
      //   Swal.fire('You can only unselect the seat beside each other.', '', 'warning')
      // } else {
        $(event.target).parent().children("label").children("div").show()
        $(event.target).parent().children("label").children("img").hide()
        this.props.dispatch(removeSeatSelection(ticket_id))
        if (in_marketplace) {
          this.props.dispatch(removeSeat2ndSelection(ticket_id))
        }
      // }
    }
  }

  componentDidMount() {
    this.gen_selectSeat_html()
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.selectedZone !== this.props.selectedZone) {
        this.gen_selectSeat_html()
    }
  }

  render () {
    let zone_price = BigNumber.from(this.props.purchase.zoneAvailability[this.props.selectedZone]['price'])
    let zone_price_fee = BigNumber.from(this.props.purchase.single_gas_fee)
    // let total_zone_price = zone_price.add(zone_price_fee)
    let total_zone_price = zone_price
    let shown_zone_price = ethers.utils.formatEther(total_zone_price)

    if (this.state.show_resale) {

    }

    return (
        <div ref={this.legendRef} className="container-lg py-5">
            <div className="row mt-5">
                <h2 className="fw-bold my-4">Select your seats</h2>
                <h2 className="fw-bold">Zone { this.props.selectedZone }</h2>
                <p className="fw-bold mb-3">
                  <span className="me-2">Price:</span> 
                  <AvaxCircle className="avax-text mb-1 my-auto" style={{width: "0.8em", height: "0.8em"}} /> 
                  <span className="ms-1">~{ parseFloat(shown_zone_price).toFixed(2) }</span>
                </p>
            </div>
            <div className="row" >
                <div className="col">
                <div className="form-check form-switch resale-toggle">
                    <h5 className="fw-bold">
                        Include resale tickets? { (this.state.show_resale) ? (<span className="toggle-status checked">Yes!</span>) : (<span className="toggle-status">No.</span>) }
                    </h5>
                    <input className="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault" onChange={this.toggle_seat_mode} />
                </div>
                </div>
            </div>
            <div className="row mt-3 justify-content-center">
                <div className="col-sm-4 overflow-hidden seat-legend">
                    <div className="row justify-content-center">
                      <div className="col-sm-4">
                        <div className="row justify-content-center">
                          <div className="col-sm-2"><FontAwesomeIcon icon={faCircle} size="lg" className="first-hand" /></div>
                          <div className="col-sm-10"><label>Available</label></div>
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className="row justify-content-center">
                          <div className="col-sm-2"><img className="seat-img-check" src={require('../../img/Sign-check-icon.png')} style={{ height: '1.5em', width: '1.5em' }} /></div>
                          <div className="col-sm-10"><label>Selected</label></div>
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className="row justify-content-center">
                        <div className="col-sm-2"><FontAwesomeIcon icon={faBan} size="lg" /></div>
                          <div className="col-sm-10"><label>Unavailable</label></div>
                        </div>
                      </div>
                    </div>

                    <div className="row justify-content-center mt-2 resale-legend" style={{display: "none"}}>
                      <div className="col-sm-4">
                        <div className="row justify-content-center">
                          <div className="col-sm-2"><FontAwesomeIcon icon={faCircle} size="lg" className="second-hand-normal" /></div>
                          <div className="col-sm-10"><label>Resale Ticket</label></div>
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className="row justify-content-center">
                          <div className="col-sm-2"><FontAwesomeIcon icon={faCircle} size="lg" className="second-hand-high" /></div>
                          <div className="col-sm-10"><label>High Price</label></div>
                        </div>
                      </div>
                    </div>
                </div>
            </div>
            <div className="row my-5">
              <div className="col-sm-9">
                <form>
                {this.state.selectSeathtml}
                </form>
              </div>
              <div className="col-sm-3">
                <BookingBox 
                  zone={this.props.selectedZone} 
                  event_id={this.props.event_id}
                  buyTicketClickHandler={this.buyTicketClickHandler}
                />
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
  event_id: ownProps.params.id,
  selectedZone: ownProps.selectedZone,
  transform_seat_data: ownProps.transform_seat_data,
  frameRef: ownProps.frameRef,
  navigate: ownProps.navigate,
});

// export default connect(mapStateToProps)(ZoneDetail_V2);
export default compose(
  withRouter,
  connect(mapStateToProps)
)(ZoneDetail_V2);