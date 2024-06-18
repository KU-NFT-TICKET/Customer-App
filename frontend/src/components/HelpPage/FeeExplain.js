import React from 'react'
import ReactDOM from 'react-dom';
import $ from 'jquery';
import axios from "axios"
import parseISO from 'date-fns/parseISO';
import { BigNumber, ethers } from 'ethers'
import { connect } from "react-redux";
import { BrowserRouter, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faDollarCircle, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { formatInTimeZone } from 'date-fns-tz';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import 'bootstrap/dist/js/bootstrap.bundle';


class FeeExplain extends React.Component {
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

    return (
        <div className="container-lg">
            <div className="head-spacer"></div>
            <h1 className="page-title align-left">Why do I have to pay Fee?</h1>
            <div className="row">

            </div>
        </div>
    )
  }
}


const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
});

export default connect(mapStateToProps)(FeeExplain);