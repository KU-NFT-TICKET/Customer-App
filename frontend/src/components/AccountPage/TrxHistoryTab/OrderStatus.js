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
import contractTicketPlace from '../../../contracts/ticketMarketPlace.json'
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class OrderStatus extends React.Component {
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
    let status_shown = ""
    if (this.props.status === "completed") {
        status_shown = "Order Completed"
    } else if (this.props.status === "incomplete") {
        status_shown = "Order In Complete"
    }

    return (
        <div className={"d-inline-block px-3 py-1 fw-bold order-status "+this.props.status}>
            {status_shown}
        </div>
    )
  }
}


const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  status: ownProps.status
});

export default connect(mapStateToProps)(OrderStatus);