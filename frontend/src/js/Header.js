import React from 'react'
import $ from 'jquery';
import axios from "axios"
import format from 'date-fns/format';
import { BigNumber, ethers } from 'ethers'
import { compose } from "redux";
import { connect } from "react-redux";
import withRouter from './withRouter';
import 'bootstrap/dist/js/bootstrap.bundle';
import MainNavBar from '../components/Header/MainNavBar'
import OrganizerNavBar from '../components/Header/OrganizerNavBar'
import SeatingHeader from '../components/Header/SeatingHeader'
import CheckoutHeader from '../components/Header/CheckoutHeader'



class Header extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
        is_mount: false,
    }

  }

  componentDidMount() {
    this.setState({
        is_mount: true
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log(this.props.location.pathname)
  }

  render () {
    return (
        (this.props.location.pathname.endsWith("seating")) ? (
          <SeatingHeader />
        ) : (this.props.location.pathname.includes("/purchase/")) ? (
          <CheckoutHeader />
        ) : (this.props.location.pathname.includes("/organizer")) ? (
          <OrganizerNavBar />
        ) : (
          <MainNavBar />
        )
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
});

// export default connect(mapStateToProps)(Header);
export default compose(
    withRouter,
    connect(mapStateToProps)
  )(Header);