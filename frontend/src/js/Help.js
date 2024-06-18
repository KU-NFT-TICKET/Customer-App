import React from 'react'
import $ from 'jquery';
import axios from "axios"
import parseISO from 'date-fns/parseISO';
import { BigNumber, ethers } from 'ethers'
import {
    Route,
    NavLink,
    HashRouter,
    Routes,
    useParams
} from "react-router-dom";
import { connect } from "react-redux";
import { compose } from "redux";
import withRouter from './withRouter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faDollarCircle } from '@fortawesome/free-solid-svg-icons'
import { formatInTimeZone } from 'date-fns-tz';
import Swal from 'sweetalert2'
import 'bootstrap/dist/js/bootstrap.bundle';
import FeeExplain from "../components/HelpPage/FeeExplain";
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class Help extends React.Component {
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
        <Routes>
            <Route path="/why-do-i-have-to-pay-fee" element={<FeeExplain/>}/>
        </Routes>
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
)(Help);