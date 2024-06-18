import React from 'react'
import axios from "axios"
import { BigNumber, ethers } from 'ethers'
import { connect } from "react-redux";
import { 
  gen_purchase_form, 
  get_createTicket_gasFee,
} from '../../../features/function'
import { updateAllEvents } from '../../../features/events/eventSlice';
import Ticket from './Ticket'

class Redeem extends React.Component {
	 constructor (props) {
    super(props)

    this.state = {
      content_loading: 1,
      ticket_mapping: [],
      is_mount: false,
      fee: BigNumber.from(0),
      purchase_forms: {}
    }

    this.load_content = this.load_content.bind(this)
  }

  async load_content() {
    this.setState({
      content_loading: 1,
    })

    let run_count = 0
    let fee = BigNumber.from(0)
    let purchase_forms = {}
    let ticket_mapping = []
    let get_hold_tickets_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/hold_tickets?receiver=" + this.props.account_detail.wallet_accounts[0].toLowerCase())
    let my_redeems = get_hold_tickets_resp.data
    for (let ticket_row of my_redeems) {
      run_count += 1
      // get event detail
      if (!Object.keys(this.props.events.all_events).includes(ticket_row['event_id'].toString())) {
        console.time("load event "+ticket_row['event_id']+" api");
        let get_event_resp = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + ticket_row['event_id'])
        console.timeEnd("load event "+ticket_row['event_id']+" api");
        let event_detail = get_event_resp.data
        await this.props.dispatch(updateAllEvents(event_detail))
      }

      let event_detail = this.props.events.all_events[ticket_row.event_id]
      
      // ticket_detail
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
        // market_price: market_price,
      }
      ticket_mapping.push(seat_detail)

      // purchase form
      let purchase_form = gen_purchase_form(
        seat_detail, 
        event_detail, 
        this.props.account_detail.wallet_accounts[0], 
        this.props.account_detail.timezone
      )
      purchase_forms[seat_detail.ticket_id] = purchase_form

      if (run_count === 1) {
        fee = await get_createTicket_gasFee(purchase_form)
      }
    }
    console.log(ticket_mapping)

    this.setState({
      content_loading: 0,
      ticket_mapping: ticket_mapping,
      purchase_forms: purchase_forms,
      fee: fee,
    })
    console.log(this.state.purchase_forms)
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
      prevProps.account_detail.wallet_accounts !== this.props.account_detail.wallet_accounts ||
      prevProps.account_detail.thai_id !== this.props.account_detail.thai_id
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
          <div className="col account-page redeem-tab">
            <div className="row justify-content-center">
              <div className="col-sm-11 pt-5 text-start header">
                <h3 className="fw-bold">Redeem</h3>
                <div className="row">
                  <div className="col py-4"></div>
                </div>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-sm-11 py-4 content">
                {
                  this.state.ticket_mapping.map((ticket_detail, index) => (
                    <Ticket 
                      ticket_detail={ticket_detail} 
                      event_detail={this.props.events.all_events[ticket_detail.event_id]} 
                      purchase_form={this.state.purchase_forms[ticket_detail.ticket_id]} 
                      fee={this.state.fee} 
                      load_tickets={this.props.load_tickets}
                    />
                  ))
                }
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

export default connect(mapStateToProps)(Redeem);