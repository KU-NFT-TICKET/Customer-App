import React from 'react'
import $ from 'jquery';
import axios from "axios"
import parseISO from 'date-fns/parseISO';
import { BigNumber, ethers } from 'ethers'
import { BrowserRouter, Link } from 'react-router-dom'
import { connect } from "react-redux";
import { compose } from "redux";
import withRouter from '../../../js/withRouter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faDollarCircle } from '@fortawesome/free-solid-svg-icons'
import { formatInTimeZone } from 'date-fns-tz';
import Swal from 'sweetalert2'
import 'bootstrap/dist/js/bootstrap.bundle';
import contractTicketPlace from '../../../contracts/ticketMarketPlace.json'
import OrderStatus from './OrderStatus'
import Timer from '../../Timer'
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class OrderBox extends React.Component {
	 constructor (props) {
    super(props)

    this.state = {
      is_mount: false,
    }


  }

  componentDidMount() {
    this.setState({
      is_mount: true,
    })

  }

  componentDidUpdate(prevProps, prevState) {

    if ( prevState.is_mount !== this.state.is_mount ) {

    }

  }

  render () {
    let event_detail = this.props.events.all_events[this.props.order_detail.event_id]
    let imgurl = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/" + event_detail.event_id + ".png"
    let show_datetime_event = formatInTimeZone(new Date(event_detail.date_event), this.props.account_detail.timezone, 'iiii d MMMM yyyy HH:mm')
    let view_link = "/order/"+this.props.order_id

    let order_status = "completed"
    if (this.props.order_detail.incompleted_trx_count > 0) {
        order_status = "incomplete"
        view_link = "/purchase/"+this.props.order_id
    }

    return (
      
      <div className="row my-2">
        <div className={"py-3 col order-box " + order_status}>
          <div className="row">
            <div className="col-sm-2" style={{width: "20.75%"}}>
              <img src={imgurl} style={{width: '8em', minHeight: '100%'}}/> 
            </div>
            <div className="col text-start">
                <div className="row">
                    <span className="col py-1 fw-bold order-id">Order #{this.props.order_id}</span>
                </div>
                <div className="row">
                    <h5 className="col fw-bold">{event_detail.event_name}</h5>
                </div>
                <div className="row">
                    <ul className="col">
                    <li className="row py-1">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarDays} /></div>
                        <div className="col-sm-11 fw-bold">
                        {show_datetime_event}
                        </div>
                    </li>
                    <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faLocationDot} /></div>
                        <div className="col-sm-11 fw-bold">
                        {event_detail.venue}
                        </div>
                    </li>
                    </ul>
                </div>
            </div>
            <div className="col-sm-4">
                <div className="container-fluid d-flex h-100 flex-column">
                    {
                        (order_status === "incomplete") ? (
                            <div className="row text-end">
                                <div className="col fw-bold">
                                    <span className="me-3">Time remain</span>
                                    <span className="h4 fw-bold">
                                        <Timer 
                                            targetDate={this.props.order_detail.deadline_time} 
                                            onTimerEnd={this.props.get_trxs} 
                                        />
                                    </span>
                                </div>
                            </div>
                        ) : (
                            null
                        )
                    }
                    <div className="row pt-2 pb-1">
                        <div className="col text-end">
                            <OrderStatus status={order_status} />
                        </div>
                    </div>
                    <div className="row justify-content-end flex-fill d-flex align-items-end">
                        <div className="col-sm-6 text-end">
                        <Link to={view_link} >
                            <button type="button" className={"btn btn-warning fw-bold order-view " + order_status} >View Order</button>
                        </Link>
                        </div>
                    </div>
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
  purchase: state.purchase,
  events: state.events,
  order_id: ownProps.order_id,
  order_detail: ownProps.order_detail,
  get_trxs: ownProps.get_trxs,
});

export default compose(
  withRouter,
  connect(mapStateToProps)
)(OrderBox);