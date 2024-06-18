import React from 'react'
import $ from 'jquery';
import {
  Route,
  NavLink,
  HashRouter,
  Routes,
  useParams
} from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons'
import { connect } from "react-redux";
// import CryptoJS from 'crypto-js'
import axios from "axios"
import { decode_thaiID } from '../../features/function'


export class AccountTab extends React.Component {
  constructor () {
    super()
    this.state = {}
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.account_detail.wallet_accounts != this.props.account_detail.wallet_accounts) {

    }
  }

  render () {
   	return (
      <NavLink to="/account/profile" className="nav-link">
        <FontAwesomeIcon icon={faCircleUser} style={{ height: '2em'}} />
	    </NavLink>
    )
  }

}

const mapStateToProps = (state) => ({
  account_detail: state.account
});

export default connect(mapStateToProps)(AccountTab);