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

class SellPopup extends React.Component {
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
    let fee = parseFloat(ethers.utils.formatEther(this.props.fee)).toFixed(4)
    let original_price = parseFloat(ethers.utils.formatEther(BigNumber.from(this.props.ticket_detail.price))).toFixed(4)

    return (
        <div className="row">
        {   this.props.popupShown &&
                ReactDOM.createPortal(
                <div className="container redeem-popup">
                    <div className="row">
                        <div className="col">
                            <div className="row justify-content-center">
                                <div className="col-sm-4 text-body text-end">
                                    <span className="h4 fw-bold">Your Price</span>
                                </div>
                                <div className="col-sm-4 ps-1 text-start">
                                    <Avax className="avax-red mb-2" style={{width: "1.2em", height: "1.2em"}} />
                                    <input
                                        className="ms-2"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="20"
                                        value={this.state.value}
                                        onChange={(event) =>
                                            this.props.onPriceChange(event)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="row mt-1 justify-content-center align-items-center">
                                <div className="col-sm-4 text-end">
                                    <small className="fw-bold">Original Price</small>
                                </div>
                                <div className="col-sm-4 ps-2 text-start">
                                    <Avax className="avax-gray mb-1 my-auto" style={{width: "0.8em", height: "0.8em"}} />
                                    <small className="fw-bold ms-2">{original_price}</small>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col">
                                    <Link to="/help/why-do-i-have-to-pay-fee" target="_blank">
                                        <p className="mt-5 mb-1 fee-info">
                                            <FontAwesomeIcon icon={faCircleInfo} />
                                            <span className="ms-1">Network fee will be collected to list your sale on Marketplace</span>
                                        </p>
                                    </Link> 
                                    <small className="network-fee">
                                        <span className="me-3">Network Fee</span>
                                        <Avax className="avax-gray mb-1 my-auto" style={{width: "0.8em", height: "0.8em"}} />
                                        <span className="fw-bold ms-1">~{fee}</span>
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                this.props.PopupSwal.getHtmlContainer()
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
  PopupSwal: ownProps.PopupSwal,
  popupShown: ownProps.popupShown,
  ticket_detail: ownProps.ticket_detail,
  fee: ownProps.fee,
  onPriceChange: ownProps.onPriceChange,
});

export default connect(mapStateToProps)(SellPopup);