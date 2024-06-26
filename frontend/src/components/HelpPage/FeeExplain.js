import React from 'react'
import ReactDOM from 'react-dom';
import $ from 'jquery';
import axios from "axios"
import parseISO from 'date-fns/parseISO';
import { BigNumber, ethers } from 'ethers'
import { connect } from "react-redux";
import { BrowserRouter, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faDollarCircle, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { formatInTimeZone } from 'date-fns-tz';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import 'bootstrap/dist/js/bootstrap.bundle';


class FeeExplain extends React.Component {
	 constructor (props) {
    super(props)

    this.state = {
      is_mount: false,
    }

    
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

    return (
        <div className="container-lg">
            <div className="head-spacer"></div>
            <h1 className="page-title align-left">Why do I have to pay <span className="color-accent">Fee</span>?</h1>
            <div className="row">
              <div className="col-sm-10 px-3 text-start">
                <p className="h3 my-5 fee-explain-text">
                To ensure that transactions on our platform are transparent and verifiable, we choose <span className="color-avax fw-bold">Avalanche blockchain</span> to record your tickets and transactions.
                </p>
                <p className="h3 my-5 fee-explain-text">
                When recording transactions or creating tickets in the form of NFTs on the blockchain, there will be a fee to be paid to the system as an <span className="color-accent fw-bold">operation cost</span>, which will vary <u>depending on type of action and how busy of the system at the moment</u>.
                </p>
                <p className="h3 my-5 fee-explain-text">
                But don’t worry, we will always notify you of these Network fees before you decide to make a transaction.
                </p>
              </div>
            </div>
            <div className="row mb-5">
              <div className="col px-3 text-start">
                <p className="h2 my-5 fw-bold">
                Fees will be charged when you carry out these types of transactions:
                </p>
                <ul className="h3 fee-explain-list">
                  <li>Buying tickets</li>
                  <li>Canceling ticket sales</li>
                  <li>Redeeming tickets</li>
                  <li>Reselling tickets</li>
                </ul>
              </div>
            </div>
            <div className="head-spacer"></div>
        </div>
    )
  }
}


const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
});

export default connect(mapStateToProps)(FeeExplain);