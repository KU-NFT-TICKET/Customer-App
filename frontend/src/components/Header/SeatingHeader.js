import React from 'react'
import { formatInTimeZone } from 'date-fns-tz';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faClock, faCalendarPlus, faCircleDollarToSlot, faTicket } from '@fortawesome/free-solid-svg-icons'
import { connect } from "react-redux";

class SeatingHeader extends React.Component {
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
    if (this.props.purchase.event_id !== null && Object.keys(this.props.events.all_events).length > 0) {
        let event_id = this.props.purchase.event_id
        let event_detail = this.props.events.all_events[event_id]
        let show_datetime_event = formatInTimeZone(new Date(event_detail.date_sell), this.props.account_detail.timezone, 'iiii d MMMM yyyy, HH:mm')
        let imgurl = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/" + event_id + ".png"
        return (
            <div className="container-fluid sticky-lg-top purchase-header">
                <div className="container-lg">
                    <div className="row py-2 align-items-center">
                    <div className="col-sm-2">
                        <img className="poster" src={imgurl} /> 
                    </div>
                    <div className="col-sm-10 text-start">
                        {/*<span>{this.props.purchase.eventDetail.detail}</span>*/}
                        <div className="row">
                        <div className="col-sm-11">
                            <ul>
                            <li className="row">
                                <h2 className="event-name">{event_detail.event_name}</h2>
                            </li>
                            <li className="row">
                                <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarDays} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                                <div className="col-sm-11">
                                <small className="small-color">Show Date</small>
                                <div>{show_datetime_event}</div>
                                </div>
                            </li>
                            <li className="row">
                                <div className="col-sm-1"><FontAwesomeIcon icon={faLocationDot} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                                <div className="col-sm-11">
                                <small className="small-color">Venue</small>
                                <div>{event_detail.venue}</div>
                                </div>
                            </li>
                            </ul>
                        </div>
                        </div>
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
});

export default connect(mapStateToProps)(SeatingHeader);