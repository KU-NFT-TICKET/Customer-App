import React from 'react'
import $ from 'jquery';
import axios from "axios"
import { connect } from "react-redux";
import { updateAllEvents } from '../features/events/eventSlice';
import EventBoxList from '../components/EventPage/EventBoxList'

export class Events extends React.Component {
  constructor () {
    super()
    this.state = {
      loading: false,
      is_mount: false,
    }
    this.setLoading = this.setLoading.bind(this)
  }

  async get_events() {
    this.setLoading(true)

    // const allEvent = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events")
    console.time("load events api");
    const allEvent = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events?is_selling=true")
    console.timeEnd("load events api");
    console.log("allEvent:")
    console.log(allEvent)
    
    console.time("dispatch");
    this.props.dispatch(updateAllEvents(allEvent.data))
    console.timeEnd("dispatch");

    this.setLoading(false)
  }

  setLoading(loading) {
    this.setState({
      loading: loading
    });
  }

  componentDidMount() {
    console.log("events page did mount.")
    this.setState({
      is_mount: true,
      // loading: true,
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.is_mount !== this.state.is_mount && this.state.is_mount) {
      this.get_events()
    }
  }

  render () {
    if (this.state.loading) {
      return (
        <div className="container-lg">
          <div className="head-spacer"></div>
          <img className="loading-black" style={{width: '2em', 'height': '2em'}} />
        </div>
      )
    } else if (Object.keys(this.props.events.all_events).length > 0) {
      let onsale_events = []
      let now = new Date()
      for (let event_id of Object.keys(this.props.events.all_events)) {
        let event_detail = this.props.events.all_events[event_id]
        let date_event = new Date(event_detail["date_event"])
        let date_sell = new Date(event_detail["date_sell"])
        if (now >= date_sell && now < date_event) {
          onsale_events.push(event_detail)
        }
      }

      return (
        <div className="container-lg">
          <div className="head-spacer"></div>
          <h1 className="page-title align-left">Popular Events</h1>
          <EventBoxList event_list={onsale_events} />
        </div>
      )
    } else {
      return (
        <div className="container-lg">
          <div className="head-spacer"></div>
          <h1 className="page-title align-left">Popular Events</h1>
          <div className="card mb-3 panel-style">
            <div className="card-body">
              <h5 className="card-title">Welcome to NFT Ticket</h5>
              <p className="card-text">There are no available events at the moment.</p>
            </div>
          </div>
        </div>
      )
    }
  }

}

const mapStateToProps = (state) => ({
  account_detail: state.account,
  events: state.events,
});

export default connect(mapStateToProps)(Events);
