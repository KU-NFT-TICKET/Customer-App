import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faClock, faCalendarPlus, faCircleDollarToSlot, faTicket } from '@fortawesome/free-solid-svg-icons'
import { ReactComponent as Avax } from '../../img/avax-icon.svg';
import { formatInTimeZone } from 'date-fns-tz';
import withRouter from '../../js/withRouter';
import {BrowserRouter as Router, Link} from 'react-router-dom'
import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { compose } from "redux";
import { connect } from "react-redux";

class EventHeader extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      
    }

    this.baseState = this.state
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps, prevState) {
  }

  render() 
  {
    let date_ob = new Date();
    let event_detail = this.props.event_detail
    let show_date_sell = formatInTimeZone(new Date(event_detail.date_sell), this.props.account_detail.timezone, 'iiii d MMMM yyyy HH:mm')
    let show_date_event = formatInTimeZone(new Date(event_detail.date_event), this.props.account_detail.timezone, 'iiii d MMMM yyyy')
    let show_time_event = formatInTimeZone(new Date(event_detail.date_event), this.props.account_detail.timezone, 'HH:mm')
    let seating_link = "/event/"+this.props.event_id+"/seating";
    let imgurl = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/" + this.props.event_id + ".png"

    let price_show = '~' + this.props.price_detail.join(', ~') 
    // let price_show = '~' + this.props.price_detail.join(', ~') + ' AVAX'
    let status_event = ''
    let status_txt = ''
    if (date_ob <= new Date(event_detail.date_event)) {
      if (this.props.seat_count > 0) {
        if (date_ob >= new Date(event_detail.date_sell)) {
          // ticket on sell
          status_event = 'status-event status-on'
          status_txt = 'ON SELL'
        } else {
          status_event = 'status-event status-hold'
          status_txt = 'NOT AVAILABLE'
        }
      } else {
        status_event = 'status-event status-off'
        status_txt = 'SOLD OUT'
      }
    } else {
      status_event = 'status-event status-off'
      status_txt = 'EVENT CLOSE'
    }

    return (
      <div className="event-header bg-cover-blur">
      <div className="bg-overlay">
      <div className="container-lg">
        <div className="row">
          <div className="col-sm-8 event-detail d-flex flex-column flex-wrap justify-content-around">
            <div className="row">
              <h1 className="event-title">{event_detail.event_name}</h1>
              <span>{event_detail.detail}</span>
            </div>
            <div className="row">
                <div className="row">
                  <div className="col-sm-6">
                    <div className="row">
                      <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarDays} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                      <div className="col-sm-11">
                        <small className="small-color">Show Date</small>
                        <div>{show_date_event}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="row">
                      <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarPlus} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                      <div className="col-sm-11">
                        <small className="small-color">Public Sale</small>
                        <div>{show_date_sell}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-6">
                    <div className="row">
                      <div className="col-sm-1"><FontAwesomeIcon icon={faLocationDot} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                      <div className="col-sm-11">
                        <small className="small-color">Venue</small>
                        <div>{event_detail.venue}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="row">
                      <div className="col-sm-1"><FontAwesomeIcon icon={faCircleDollarToSlot} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                      <div className="col-sm-11">
                        <small className="small-color">Ticket Price</small>
                        <div><Avax className="avax-base mb-1 my-auto" style={{width: "1em", height: "1em"}} /> {price_show} </div>
                        
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-6">
                    <div className="row">
                      <div className="col-sm-1"><FontAwesomeIcon icon={faClock} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                      <div className="col-sm-11">
                        <small className="small-color">Show Time</small>
                        <div>{show_time_event}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="row">
                      <div className="col-sm-1"><FontAwesomeIcon icon={faTicket} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                      <div className="col-sm-11">
                        <small className="small-color">Ticket Status</small><br />
                        <span className={status_event}><span>{status_txt}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
          <div className="col-sm-4 event-poster">
            <img src={imgurl} /> 
          </div>
        </div>
        <div className="row">
          <div className="col-sm-4 offset-sm-8 justify-content-center">
            <Link to={{pathname: seating_link, state: this.props.event_id}}>
              <button type="button" className="btn btn-warning btn-lg my-4 select-ticket-btn">Select Tickets</button>
            </Link>
          </div>
        </div>
      </div>
      </div>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  event_id: ownProps.event_id,
  event_detail: ownProps.event_detail,
  price_detail: ownProps.price_detail, 
  seat_count: ownProps.seat_count, 
});

// export default withRouter(Event_Detail);
export default compose(
  withRouter,
  connect(mapStateToProps)
)(EventHeader);

 