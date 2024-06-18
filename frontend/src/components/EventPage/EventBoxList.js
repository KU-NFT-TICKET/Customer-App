import React from 'react'
import $ from 'jquery';
import format from 'date-fns/format';
import { connect } from "react-redux";
import {BrowserRouter as Router, Link} from 'react-router-dom'
import EventBox from './EventBox'

class EventBoxList extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  render () {
    
  	return (
  		<div className="row">
      {
        this.props.event_list.map((event_detail)=>{
          return (
            <div className="col-lg-3 col-sm-6" key={event_detail["event_id"]}>
              <EventBox 
                detail={event_detail} 
                timezone={this.props.account_detail.timezone}
              />
            </div>
          )
        })
      }
      </div>
  	)
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  events: state.events,
  event_list: ownProps.event_list,
});

export default connect(mapStateToProps)(EventBoxList);