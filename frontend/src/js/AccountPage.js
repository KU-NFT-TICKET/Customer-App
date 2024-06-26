import React from 'react'
import $ from 'jquery';
import axios from "axios"
import {
  Route,
  NavLink,
  HashRouter,
  Routes,
  useParams
} from "react-router-dom";
import withRouter from './withRouter';
import { BigNumber, ethers } from 'ethers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser, faUser, faHistory, faTicket } from '@fortawesome/free-solid-svg-icons'
import { faCopy } from '@fortawesome/free-regular-svg-icons'
import { connect } from "react-redux";
import { compose } from "redux";
import { decode_thaiID, is_ticket_available, sortArrayByMultipleKeys } from '../features/function'
// import AccountContent from '../components/AccountPage/AccountContent'
import { AuthenticationContext } from '../contexts/AuthenticationContext'
import AccountDetail from '../components/AccountPage/ProfileTab/AccountDetail'
import TrxHistory from '../components/AccountPage/TrxHistoryTab/TrxHistory'
import Tickets from '../components/AccountPage/TicketsTab/Tickets'
import TicketDetail from '../components/AccountPage/TicketsTab/TicketDetail'
import Redeem from '../components/AccountPage/RedeemTab/Redeem'

const PAGE_TITLES = {
  'profile': 'Profile',
  'history': 'History',
  'my_tickets': 'My Tickets',
  // Add more paths and titles as needed
};

class AccountPage extends React.Component {
  static contextType = AuthenticationContext;
	 constructor (props) {
    super(props)

    this.state = {
      is_mount: false,
    	page: "AccountDetail",
    }
    this.setPageName = this.setPageName.bind(this)
    this.clickToCopy = this.clickToCopy.bind(this)
  }

  clickToCopy(event) {
    let text = $(event.target).text()
    navigator.clipboard.writeText(text)
  }

  setPageName(page_name){
  	// console.log("setPage!: " + text)
  	// this.props.dispatch(setAccountPage(page_name))
  	this.setState({
      page: page_name,
    })
  }

  componentDidMount() {
    this.setState({
      is_mount: true
    })
  }

  componentDidUpdate(prevProps, prevState) {
    console.log("update")
    console.log(this.props)
    if ( prevState.is_mount !== this.state.is_mount ) {
      if (!this.props.account_detail.isLogin) {
        const { connectWallet } = this.context;
        connectWallet(
          ()=>{},
          ()=>{this.props.navigate(-1)},
        )
      }
    }
  }

  componentWillUnmount() {
  }

  render () {

    return (
    		// {/* <h1 style={{color: 'snow', marginBottom: '40px'}}>{PAGE_TITLES[this.props.params["*"]]}</h1> */}
      <div className="container-lg">
        <div className="head-spacer"></div>
        <h1 className="page-title align-left">My Account</h1>
    		{ 
          (this.props.account_detail.isLogin) ? (
            <div className="row">
              <div className="col-sm-3 py-3 profile-sidebar">
                <div className="row justify-content-center">
                  <div className="col-sm-10 py-3 profile">
                    <FontAwesomeIcon icon={faCircleUser} size="7x" style={{color: '#E3B04B'}} />
                    <h2 className="mt-3 fw-bold">{this.props.account_detail.username}</h2>
                    <small className="mx-auto fw-bold address" onClick={this.clickToCopy}>
                      <FontAwesomeIcon icon={faCopy} size="xs" />
                      <span className="ms-1">{this.props.account_detail.wallet_accounts[0]}</span>
                    </small>
                  </div>
                </div>
                <div className="row justify-content-center">
                  <div className="col px-0 py-3">
                    <ul className="navbar-nav account-nav  me-auto mb-2 mb-lg-0">
                      <li className="nav-item">
                        <NavLink to="/account/profile" className="nav-link">
                          <div className="row justify-content-center align-items-center">
                            <div className="col-1"><FontAwesomeIcon icon={faUser} /></div>
                            <div className="col-4 text-start"><span className="h5 ms-1 fw=bold">Profile</span></div>
                          </div>
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <NavLink to="/account/history" className="nav-link">
                          <div className="row justify-content-center align-items-center">
                            <div className="col-1"><FontAwesomeIcon icon={faHistory} /></div>
                            <div className="col-4 text-start"><span className="h5 ms-1 fw=bold">History</span></div>
                          </div>
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <NavLink to="/account/tickets" className="nav-link">
                          <div className="row justify-content-center align-items-center">
                            <div className="col-1"><FontAwesomeIcon icon={faTicket} /></div>
                            <div className="col-4 text-start"><span className="h5 ms-1 fw=bold">Tickets</span></div>
                          </div>
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <NavLink to="/account/redeem" className="nav-link">
                          <div className="row justify-content-center align-items-center">
                            {/* <div className="col-1"><FontAwesomeIcon icon={faTicket} size="lg" /></div> */}
                            <div className="col-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                                <path fill="#000" d="M15.547 12.256c.495-.41.6-1.19.236-1.747-.364-.556-1.058-.675-1.552-.265L10.906 13h-3.35c-.245 0-.445-.225-.445-.5s.2-.5.445-.5h2.222c.491 0 .889-.447.889-1 0-.553-.398-1-.89-1H5.382c-.809 0-1.592.31-2.223.875L1.911 12H.89c-.493 0-.89.447-.89 1v2c0 .553.397 1 .889 1h8.903c.805 0 1.591-.29 2.241-.828l3.517-2.916h-.003Zm-10.17-.26a.017.017 0 0 1 .002.015.016.016 0 0 1-.003.007.015.015 0 0 1-.007.003.013.013 0 0 1-.012-.004.017.017 0 0 1-.004-.014.017.017 0 0 1-.002-.015l.004-.006a.013.013 0 0 1 .013-.003.014.014 0 0 1 .01.01v.008ZM5.319 7.85 6.55 9.619h2.394L11.86 7.18c.133-.108.161-.32.063-.473L10.14 3.933c-.098-.153-.287-.19-.42-.082L5.383 7.377c-.133.108-.161.321-.063.474Z"/>
                                <path fill="#000" d="M3.106 6.693c-.532.432-.644 1.28-.25 1.893l.713 1.109c.098.152.286.181.444.13.214-.07.27-.13.522-.13l1.187-.077-1.064-1.653c-.197-.307-.14-.73.126-.946L9.604 3.1c.268-.217.642-.144.84.163l2.14 3.327c.198.307.142.73-.125.947l-2.57 2.09s.491-.004.757.213c.189.154.378.708.378.708l3.113-2.686c.532-.432.644-1.28.25-1.892l-.713-1.11c-.098-.152-.287-.181-.444-.13-.356.118-.759-.027-.993-.391a1.132 1.132 0 0 1-.02-1.182c.093-.152.128-.362.03-.515l-.714-1.109c-.393-.612-1.146-.758-1.677-.326l-6.75 5.485Z"/>
                              </svg>
                            </div>
                            <div className="col-4 text-start"><span className="h5 ms-1 fw=bold">Redeem</span></div>
                          </div>
                        </NavLink>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col ms-sm-4 profile-sidebar">
                <Routes>
                  <Route path="/profile" element={<AccountDetail/>}/> 
                  <Route path="/history" element={<TrxHistory/>}/>
                  <Route path="/tickets" element={<Tickets/>}/>
                  <Route path="/tickets/:ticket_id" element={<TicketDetail/>}/>
                  <Route path="/redeem" element={<Redeem/>}/>
                </Routes>
              </div>
            </div>
          ) : (
            <div className="head-spacer">
              <img className="loading-black" style={{width: '2em', 'height': '2em'}} />
            </div>
          )
        }
        </div>
      )
  }
}


const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
});

// export default connect(mapStateToProps)(AccountPage);

export default compose(
  withRouter,
  connect(mapStateToProps)
)(AccountPage);