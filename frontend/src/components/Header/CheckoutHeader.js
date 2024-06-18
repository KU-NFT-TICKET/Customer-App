import React from 'react'
import $ from 'jquery';
import format from 'date-fns/format';
import { BigNumber, ethers } from 'ethers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faClock, faCalendarPlus, faCircleDollarToSlot, faTicket } from '@fortawesome/free-solid-svg-icons'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import { NavLink } from "react-router-dom";
import { connect } from "react-redux";

class CheckoutHeader extends React.Component {
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

    let state_status = ["active", "", ""]
    let line_status = ["", ""]
    if (this.props.purchase.purchaseState === 1) {
        state_status = ["active", "", ""]
        line_status = ["", ""]
    } else if (this.props.purchase.purchaseState === 2) {
        state_status = ["active", "active", ""]
        line_status = ["active", ""]
    } else if (this.props.purchase.purchaseState === 3) {
        state_status = ["active", "active", "active"]
        line_status = ["active", "active"]
    }


    return (
        <div className="container-fluid checkout-header">
            <div className="container-lg">
                <div className="row py-2 justify-content-center text-center">
                <div className="col-sm-5">
                    <div className="row align-items-center" >
                        <div className="col-sm-2" id="checkout">
                            <div className={"state " + state_status[0]}>1</div>
                            <span>Checkout</span>
                        </div>
                        <div className={"col-sm-3 line " + line_status[0]} id="1">
                        </div>
                        <div className="col-sm-2" id="pay">
                            <div className={"state " + state_status[1]}>2</div>
                            <span>Pay</span>
                        </div>
                        <div className={"col-sm-3 line " + line_status[1]} id="2">
                        </div>
                        <div className="col-sm-2" id="complete">
                            <div className={"state " + state_status[2]}>3</div>
                            <span>Complete</span>
                        </div>
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
});

export default connect(mapStateToProps)(CheckoutHeader);