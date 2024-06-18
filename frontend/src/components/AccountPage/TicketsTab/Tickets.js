import React from 'react'
import $ from 'jquery';
import axios from "axios"
import { BigNumber, ethers } from 'ethers'
import { connect } from "react-redux";
import { 
  decode_thaiID, 
  sortArrayByMultipleKeys, 
  get_2ndHand_price, 
  get_ticket_status, 
} from '../../../features/function'
import { updateAllEvents } from '../../../features/events/eventSlice';
// import MyTicketsPanel from './MyTicketsPanel'
import TicketBox from './TicketBox'
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class Tickets extends React.Component {
	 constructor (props) {
    super(props)

    this.state = {
      content_loading: 0,
      ticket_mapping: [],
      is_mount: false,
      ticket_filter: 'active',
    }

    this.load_content = this.load_content.bind(this)
    this.filterOnClick = this.filterOnClick.bind(this)
    
  }

  filterOnClick(event) {
    let filter_value = $(event.target).attr('id')
    console.log(filter_value)

    $(".ticket-filter-nav .nav-item").removeClass("active")
    $(event.target).addClass("active")

    this.setState({
      ticket_filter: filter_value
    })
  }

  async load_content() {
    this.setState({
      content_loading: 1,
    })

    // let ticket_mapping = new Map()
    let ticket_mapping = []
    console.time("load tickets api");
    let get_ticket_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/seats?owner=" + this.props.account_detail.wallet_accounts[0])
    // let get_ticket_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/seats?owner=" + this.props.account_detail.wallet_accounts[0] + "&ticket_id=1242,909")
    console.timeEnd("load tickets api");
    console.log(get_ticket_resp)

    let my_tickets = get_ticket_resp.data
    my_tickets = sortArrayByMultipleKeys(my_tickets, ['date_event', 'event_id', 'ticket_id'], ['date_event'], [0, 0, 0]);
    // console.log(sorted_orders)
    for (let ticket_row of my_tickets) {
      if (!Object.keys(this.props.events.all_events).includes(ticket_row['event_id'].toString())) {
        console.time("load event "+ticket_row['event_id']+" api");
        let get_event_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + ticket_row['event_id'])
        console.timeEnd("load event "+ticket_row['event_id']+" api");
        let event_detail = get_event_resp.data
        await this.props.dispatch(updateAllEvents(event_detail))
      }

      let event_detail = this.props.events.all_events[ticket_row.event_id]

      let market_price = "0"
      if (ticket_row.in_marketplace !== null) {
        let {price: raw_market_price} = await get_2ndHand_price(ticket_row.ticket_id)
        market_price = raw_market_price.toString()
      }
      
      let ticket_status = get_ticket_status(ticket_row, event_detail)

      let seat_detail = {
        ticket_id: ticket_row.ticket_id,
        event_id: ticket_row.event_id,
        gas: ticket_row.gas,
        price: ticket_row.price,
        seat_id: ticket_row.seat_id,
        seat_row: ticket_row.seat_row,
        zone: ticket_row.zone,
        metadata: ticket_row.metadata,
        owner: ticket_row.owner,
        is_hold: ticket_row.is_hold,
        is_use: ticket_row.is_use,
        in_marketplace: ticket_row.in_marketplace,
        market_price: market_price,
        ticket_status: ticket_status,
      }
      // ticket_mapping.get(ticket_row['event_id'])['tickets'].push(seat_detail)
      ticket_mapping.push(seat_detail)
    }
    console.log(ticket_mapping)

    this.setState({
      content_loading: 0,
      ticket_mapping: ticket_mapping,
    })
  }

  componentDidMount() {
    this.setState({
      is_mount: true,
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if ( prevState.is_mount !== this.state.is_mount ) {
      this.load_content()
    }

    if (
      prevProps.account_detail.wallet_accounts !== this.props.account_detail.wallet_accounts
    ) {
      this.load_content()
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
      return (
        <div className="row">
          <div className="col account-page tickets-tab">
            <div className="row justify-content-center">
              <div className="col-sm-11 pt-5 text-start header">
                <h3 className="fw-bold">Tickets</h3>
                <div className="row text-center align-items-end ticket-filter-nav">
                  <div className="col-sm-2 py-2 nav-item active" id="active" onClick={this.filterOnClick}>
                    Active Tickets
                  </div>
                  <div className="col-sm-2 py-2 nav-item" id="on-sale" onClick={this.filterOnClick}>
                    On Sale Tickets
                  </div>
                  <div className="col-sm-2 py-2 nav-item" id="past" onClick={this.filterOnClick}>
                    Past Tickets
                  </div>
                </div>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-sm-11 py-4 content">
                {
                  this.state.ticket_mapping.map((ticket_detail, index) => (
                    (ticket_detail.ticket_status === this.state.ticket_filter) ? (
                      <TicketBox 
                        ticket_detail={ticket_detail} 
                        event_detail={this.props.events.all_events[ticket_detail.event_id]} 
                        load_tickets={this.props.load_tickets}
                      />
                    ) : ([])
                  ))
                }
                
                {/* {
                  [...this.state.ticket_mapping.entries()].map(([event_id, detail]) => (
                    <MyTicketsPanel event_detail={detail['event']} ticket_list={detail['tickets']} load_tickets={this.load_content}/>
                  ))
                } */}
              </div>
            </div>
          </div>
        </div>

        // <div className="row" style={history_table_style}>
        //   {
        //     [...this.state.ticket_mapping.entries()].map(([event_id, detail]) => (
        //       <MyTicketsPanel event_detail={detail['event']} ticket_list={detail['tickets']} load_tickets={this.load_content}/>
        //     ))
        //   }
        // </div>
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

export default connect(mapStateToProps)(Tickets);