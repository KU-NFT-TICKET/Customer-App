import React from 'react'
import { BigNumber, ethers } from 'ethers'
import { connect } from "react-redux";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons'
import { ReactComponent as Avax } from '../../img/Avalanche_AVAX_Black.svg';
import { Link } from 'react-router-dom'

class BookingBox extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
    }

  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps, prevState) {
  }

  render () {
    let firsthand_tickets = this.props.purchase.seatSelection.filter(x => !this.props.purchase.seat2ndSelection.includes(x))
    let secondhand_tickets = this.props.purchase.seat2ndSelection

    let seat_number_show = "";
    if (this.props.purchase.seatSelection.length === 0) {
      seat_number_show = "";
    } else if (this.props.purchase.seatSelection.length === 1) {
      seat_number_show = this.props.purchase.selected_seat_row + this.props.purchase.min_selected_seatID;
    } else if (this.props.purchase.seatSelection.length > 1) {
      seat_number_show = this.props.purchase.selected_seat_row + this.props.purchase.min_selected_seatID + " - " + this.props.purchase.max_selected_seatID;
    }

    let firsthand_prices = BigNumber.from(this.props.purchase.single_price).mul(firsthand_tickets.length)
    let secondhand_prices = BigNumber.from(0)
    for (let sec_id of secondhand_tickets) {
      if (this.props.purchase.marketplace_prices.hasOwnProperty(sec_id)) {
        let this_price = BigNumber.from(this.props.purchase.marketplace_prices[sec_id])
        secondhand_prices = secondhand_prices.add(this_price)
      }
    }

    let firsthand_gas = BigNumber.from(this.props.purchase.single_gas_fee).mul(firsthand_tickets.length)
    console.log(firsthand_gas)
    let secondhand_gas = BigNumber.from(this.props.purchase.single_2nd_gas_fee).mul(secondhand_tickets.length)
    console.log(this.props.purchase.single_2nd_gas_fee)

    let total_gas_fee = firsthand_gas.add(secondhand_gas)
    let price = firsthand_prices.add(secondhand_prices)

    let shown_total_gas_fee = ethers.utils.formatEther(total_gas_fee)
    let shown_price = ethers.utils.formatEther(price)

    let shown_total = ethers.utils.formatEther(price.add(total_gas_fee))

    let ticket_list = []
    let selectSeats = [...this.props.purchase.seatSelection].sort()
    for (let ticket_id of selectSeats) {
      let seat_id = this.props.purchase.seatDetail[this.props.zone][ticket_id]["seat_id"]
      let seat_row = this.props.purchase.seatDetail[this.props.zone][ticket_id]["seat_row"]
      let price = this.props.purchase.seatDetail[this.props.zone][ticket_id]["shown_price"]
      // let price = this.props.purchase.seatDetail[this.props.zone][ticket_id]["price"]
      // if (this.props.purchase.marketplace_prices.hasOwnProperty(ticket_id)) {
      //   price = this.props.purchase.marketplace_prices[ticket_id]
      // }

      ticket_list.push(
        <div className="row">
          <div className="col-sm-6">
            <small>Seat no.</small>
            <h5>{seat_row + seat_id}</h5>
          </div>
          <div className="col-sm-6">
            <small>Price</small>
            <h5><Avax className="avax-text mb-1" style={{width: "0.7em", height: "0.7em"}} /> ∼{parseFloat(price).toFixed(2)}</h5>
          </div>
        </div>
      )
    }
  	
    return (
  		<div className="row booking-box">
        <div className="col">
          <div className="row">
            <div className="col p-3 header">
              <h4>Your Tickets</h4>
            </div>
          </div>
          <div className="row">
            <div className="col py-3">
              { ticket_list }
            </div>
          </div>
          <div className="row my-3">
            <div className="col">
              <h5>
                <span className="me-3">Total</span>
                <Avax className="avax-text mb-2" style={{width: "0.9em", height: "0.9em"}} /> 
                <span className="ms-1" style={{ fontWeight: 700, fontSize: '1.25em' }}>∼{parseFloat(shown_total).toFixed(2)}</span>
              </h5>
              <Link className="fee-info-link" to="/help/why-do-i-have-to-pay-fee" target="_blank">
                <small className="fee-info-link">(Fee included.)</small>
              </Link>
            </div>
          </div>
          <div className="row mb-3 justify-content-center">
            <button type="button" className="btn checkout-btn col-lg-6 col-sm-10" onClick={this.props.buyTicketClickHandler} >
              <FontAwesomeIcon icon={faShoppingCart} size="lg" /><span>Check out</span>
            </button>
          </div>

          {/* <div style={{ 'textAlign': 'left' }}>
            <p>Zone: {this.props.zone}</p>
            <p>Seat Number: {seat_number_show}</p>
            <p>Unit: {this.props.purchase.seatSelection.length}</p>
            <p>Price: {shown_price} AVAX</p>
            <p>Fee: ∼{shown_total_gas_fee} AVAX</p>
          </div> */}
        </div>
      </div>
  	)
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  zone: ownProps.zone,
  event_id: ownProps.event_id,
  buyTicketClickHandler: ownProps.buyTicketClickHandler,
});

export default connect(mapStateToProps)(BookingBox);