import React from 'react'
import $ from 'jquery';
import axios from "axios"
import { BigNumber, ethers } from 'ethers'
import { connect } from "react-redux";
import Trx from './Trx'
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class TrxHistoryPanel extends React.Component {
	 constructor (props) {
    super(props)

    this.state = {
    	// trx_list: new Map(),
      // event_detail_list: {},
      // content_loading: 1,
      openedNumber: -1,
    }

    // this.get_trxs = this.get_trxs.bind(this)
  }

  setOpenedNumber = (number) => {
    this.setState({
      openedNumber: number
    });
  }

  componentDidMount() {
    // console.log("History Page loading")
    // this.onConnected()
    // this.get_seats_detail(this.props.id)
    // this.get_trxs()
  }

  componentDidUpdate(prevProps, prevState) {
    
    // if (prevProps.purchase.seatSelection !== this.props.purchase.seatSelection) {
    //   this.get_single_gas_fee()
    // }
  }

  render () {
    const showStyle = {
      height: 'auto'
    };
    const hideStyle = {
      height: '0',
      overflow: 'hidden',
      paddingTop: '0',
      paddingBottom: '0'
    };

    let openedNumber = this.state.openedNumber
    let number = this.props.event_detail['event_id']

    return (
      <div className="row" style={{'margin-bottom': '5px'}}>
        <div className="col-sm-12">
          <div className="row panelslide-header" onClick={() => this.setOpenedNumber(number !== openedNumber ? number : -1)}>
            <div className="col-sm-11">
              <h5 style={{'margin-bottom': '0'}}>{this.props.event_detail['event_name']}</h5>
              <span>{this.props.order_id}</span>
            </div>
            <div className="col-sm-1">
              <span>{openedNumber === number ? "-" : "+"}</span>
            </div>
          </div>

          <div id="first" className="row panelslide-content" style={openedNumber === number ? showStyle : hideStyle}>
            <ul style={{"listStyleType": "none"}}>
              {this.props.trx_list.map((ticket_detail, ticket_index) => (
                  <Trx trx_detail={ticket_detail} />
              ))}
            </ul>
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
  order_id: ownProps.order_id,
  event_detail: ownProps.event_detail,
  trx_list: ownProps.trx_list,
});

export default connect(mapStateToProps)(TrxHistoryPanel);