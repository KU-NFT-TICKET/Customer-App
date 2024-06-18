import React from 'react'
import ReactDOM from 'react-dom';
import { BigNumber, ethers } from 'ethers'
import { connect } from "react-redux";
import { BrowserRouter, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faDollarCircle, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { ReactComponent as Avax } from '../../../img/Avalanche_AVAX_Black.svg';
import 'bootstrap/dist/js/bootstrap.bundle';
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class RedeemPopup extends React.Component {
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
    let seat_id = this.props.ticket_detail['seat_row'] + this.props.ticket_detail['seat_id']
    let fee = parseFloat(ethers.utils.formatEther(this.props.fee)).toFixed(4)

    return (
        <div className="row">
        {   this.props.popupShown &&
                ReactDOM.createPortal(
                <div className="container redeem-popup">
                    <div className="row">
                        <div className="col">
                            <p className="h3 fw-bold seat-info">Zone {this.props.ticket_detail['zone']} Seat {seat_id}</p>
                            <Link to="/help/why-do-i-have-to-pay-fee" target="_blank">
                                <p className="mt-5 mb-1 fee-info">
                                    <FontAwesomeIcon icon={faCircleInfo} />
                                    <span className="ms-1">Network fee will be collected to create your ticket</span>
                                </p>
                            </Link>
                            <small className="network-fee">
                                <span className="me-3">Network Fee</span>
                                <Avax className="avax-gray mb-1 my-auto" style={{width: "0.8em", height: "0.8em"}} />
                                <span className="fw-bold ms-1">~{fee}</span>
                            </small>
                        </div>
                    </div>
                </div>,
                this.props.RedeemSwal.getHtmlContainer()
            )
        }
        </div>
    )
  }
}


const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  RedeemSwal: ownProps.RedeemSwal,
  ticket_detail: ownProps.ticket_detail,
  fee: ownProps.fee,
  popupShown: ownProps.popupShown,
});

export default connect(mapStateToProps)(RedeemPopup);