import React from 'react'
import $ from 'jquery';
import format from 'date-fns/format';
import { formatInTimeZone } from 'date-fns-tz';
import {BrowserRouter as Router, Link} from 'react-router-dom'

class EventBox extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  render () {
    var url = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/"+this.props.detail.event_id+".png";
  	var link = "/event/"+this.props.detail.event_id;
    let date_sell_showtext = formatInTimeZone(
      new Date(this.props.detail.date_sell), 
      this.props.timezone,
      'dd MMM yyyy HH:mm:ss'
    )
  	return (
			<div className="card text-start event-card">
        <Link to={{pathname: link, state: this.props.detail.event_id}}>
          <img src={url} className="card-img-top card-img" alt="..." />
          <div className="card-body">
            <h5 className="card-title">{this.props.detail.event_name}</h5>
            {/*<p className="card-text">{date_sell_showtext}</p>*/}
            <p className="card-subtitle text-muted">{date_sell_showtext}</p>
          </div>
        </Link>
    	</div>
  	)
  }
}

export default EventBox;