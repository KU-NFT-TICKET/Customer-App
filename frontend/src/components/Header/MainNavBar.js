import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import { NavLink } from "react-router-dom";
import { connect } from "react-redux";
import SignupForm from '../NavBar/SignupForm'
import AccountTab from '../NavBar/AccountTab'

class MainNavBar extends React.Component {
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
    return (
        // <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <nav className="navbar navbar-expand-lg navbar-dark navbar-custom">
          <div className="container-lg">
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarText"
              aria-controls="navbarText"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <a className="navbar-brand" href="#">
              <img style={{width: 4 +'rem'}} src={require('../../img/brand_ticket.png')} />
            </a>
            <div className="collapse navbar-collapse" id="navbarText">
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                <NavLink to="/events" className="nav-link">Events</NavLink>
                </li>
                <li className="nav-item">
                <NavLink to="/buy_test" className="nav-link">Buy Test</NavLink>
                </li>
                {/*<li className="nav-item">
                <NavLink to="/" className="nav-link">Organizer →</NavLink>
                </li>*/}
              </ul>
              <form className="d-flex px-3"> 
                <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
                <button className="btn btn-outline-warning" type="submit">Search</button>
              </form>
            </div>
            <div className="px-2 noti-btn">
              <FontAwesomeIcon icon={faBell} style={{ height: '1.25em'}} />
            </div>
            <div className="px-3">
              {/* <OnboardingButton/> */}
              {
                (this.props.account_detail.isLogin) ? (
                  <AccountTab />
                ) : (
                  <SignupForm />
                )
              }
            </div>
            <div className="py-3 ps-3 organizer-btn"><NavLink to="/organizer" className="nav-link"> Organizer → </NavLink></div>
          </div>
        </nav>
  	)
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
});

export default connect(mapStateToProps)(MainNavBar);