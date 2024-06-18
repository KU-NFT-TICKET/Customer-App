import React from 'react'
import $ from 'jquery';
import axios from "axios"
import { BigNumber, ethers } from 'ethers'
import {format, parseISO, differenceInMinutes, addMinutes} from 'date-fns';
import { connect } from "react-redux";
import { decode_thaiID, sortArrayByMultipleKeys } from '../../../features/function'
import TrxHistoryPanel from './TrxHistoryPanel'
import OrderBox from './OrderBox'
import { updateAccountList } from '../../../features/account/accountSlice';
import { updateAllEvents } from '../../../features/events/eventSlice';
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class TrxHistory extends React.Component {
	 constructor (props) {
    super(props)

    this.state = {
    	trx_list: new Map(),
      event_detail_list: {},
      content_loading: 1,
      is_mount: false,
    }

    this.get_trxs = this.get_trxs.bind(this)
  }

  async get_trxs() {
    this.setState({
      content_loading: 1,
    })

  	
  	let my_orders = await axios.get(process.env.REACT_APP_API_BASE_URL+"/orders?buyer="+this.props.account_detail.wallet_accounts[0]+"&is_removed=false")
    console.log("loading_orders....")
    // console.log(my_orders)
    let sorted_orders = sortArrayByMultipleKeys(my_orders.data, ['created_date', 'order_id', 'ticket_id'], ['created_date'], [1, 0, 0]);

    let orders_details = {};
    if (sorted_orders.length > 0) {
      for (let order_detail of sorted_orders) {
        if (["createTicket", "buyProduct"].includes(order_detail["func_name"])) {
          let order_id = order_detail["order_id"]
          let event_id = order_detail["event_id"]
          let now = new Date()
          let created_date = new Date(order_detail["created_date"])
          let deadline_time = addMinutes(created_date, 15);
          if (!Object.keys(this.props.events.all_events).includes(event_id.toString())) {
            console.time("load event "+event_id+" api");
            let get_event_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + event_id)
            console.timeEnd("load event "+event_id+" api");
            let event_detail = get_event_resp.data
            await this.props.dispatch(updateAllEvents(event_detail))
          }

          if (!Object.keys(orders_details).includes(order_id)) {
            orders_details[order_id] = {
              order_id,
              event_id,
              created_date: order_detail["created_date"],
              executed_date: order_detail["executed_date"],
              deadline_time,
              transaction: order_detail["transaction"],
              price: order_detail["price"],
              fee: order_detail["fee"],
              func_name: order_detail["func_name"],
              completed_trx_count: 0,
              incompleted_trx_count: 0,
            }
          }
          
          if (order_detail["transaction"] !== null) {
            orders_details[order_id]["completed_trx_count"] += 1
          } else if (now <= deadline_time && order_detail["transaction"] === null) {
            orders_details[order_id]["incompleted_trx_count"] += 1
          }
        }
      }
    }

    console.log(orders_details)
    this.setState({
      orders_details: orders_details,
      content_loading: 0,
    })
  }

  componentDidMount() {
    this.setState({
      is_mount: true,
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if ( prevState.is_mount !== this.state.is_mount ) {
      this.get_trxs()
    }

    if (
      prevProps.account_detail.wallet_accounts !== this.props.account_detail.wallet_accounts
    ) {
      this.get_trxs()
    }
  }

  render () {
    if (this.state.content_loading === 1) {
      return (
        <div className="row" style={{'height': '100%'}}>
          {/*<img src={require('../../img/loading-black.gif')} />*/}
          <img className="loading-black" style={this.props.style.loading_size_profile}/>
        </div>
      )
    } else {
      // console.log(this.state.orders_details)
      let orderBox_list = []
      for (let order_id of Object.keys(this.state.orders_details)) {
        let order_detail = this.state.orders_details[order_id]
        if (
          order_detail["completed_trx_count"] > 0 || order_detail["incompleted_trx_count"] > 0
        ) {
          orderBox_list.push(
            <OrderBox 
              order_id={order_id} 
              order_detail={order_detail} 
              get_trxs={this.get_trxs} 
            />
          )
        }
      }

      return (
        <div className="row">
          <div className="col account-page redeem-tab">
            <div className="row justify-content-center">
              <div className="col-sm-11 pt-5 text-start header">
                <h3 className="fw-bold">History</h3>
                <div className="row">
                  <div className="col py-4"></div>
                </div>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-sm-11 py-4 content">
                { orderBox_list }
              </div>
            </div>
          </div>
        </div>
      )
    }
  }
}


const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  style: state.style,
});

export default connect(mapStateToProps)(TrxHistory);