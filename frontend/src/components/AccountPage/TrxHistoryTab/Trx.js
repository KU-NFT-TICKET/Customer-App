import React from 'react'
import $ from 'jquery';
import axios from "axios"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { BigNumber, ethers } from 'ethers'
import { connect } from "react-redux";
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class Trx extends React.Component {
	 constructor (props) {
    super(props)

    this.state = {
    	// trx_list: new Map(),
      // event_detail_list: {},
      // content_loading: 1,
    }

  }

  componentDidMount() {

  }

  componentDidUpdate(prevProps, prevState) {

  }

  render () {
    // console.log(this.props.trx_detail)
    let ticket_detail = this.props.trx_detail
    let seat_id = ticket_detail['seat_row'] + ticket_detail['seat_id']
    let zone = ticket_detail['zone']
    let Price = ethers.utils.formatEther(ticket_detail['pay_price'])
    let seller_name = ticket_detail['seller_name']

    let snowtrace_link = ""
    let snowtrace_style = {"display": "none"}
    if (ticket_detail['transaction'] !== null) {
      snowtrace_link = "https://testnet.snowtrace.io/tx/" + ticket_detail['transaction']
      snowtrace_style["display"] = "show"
    } 

    return (
      <li>
        Seat:{seat_id} &nbsp;
        Zone:{zone} &nbsp;
        Price:{Price} &nbsp;
        From:{seller_name} &nbsp;
        <a target="_blank" href={snowtrace_link} style={snowtrace_style}>
          <FontAwesomeIcon icon={faInfoCircle} style={{ height: 20, marginTop: 10 + 'px' }} />
        </a>
      </li>
    )
  }
}


const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  trx_detail: ownProps.trx_detail,
});

export default connect(mapStateToProps)(Trx);