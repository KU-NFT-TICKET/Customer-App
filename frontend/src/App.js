import './App.css'

import axios from "axios"
import React from 'react'
import MetaMaskOnboarding from '@metamask/onboarding'
import { ethers } from 'ethers'
import {
  Route,
  NavLink,
  HashRouter,
  Routes,
  // Redirect,
} from "react-router-dom";
import 'bootstrap/dist/js/bootstrap.bundle';
import { 
  changeWalletAccount, 
  changeChainId, 
  checkMetaMaskInstalled, 
  setMMInstalledFlag, 
  setConnectFlag, 
  setLoginFlag, 
  setUsername, 
  setThaiID,
  updateTimeZone,
} from './features/account/accountSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import { connect } from "react-redux";

import Home from "./js/Home";
import Create from "./js/Create";
import Detail from "./js/Detail";
import AccountPage from "./js/AccountPage";
import Events from "./js/Events";
import Event_Detail from "./js/Event_Detail";
import Seating from "./js/Seating";
import Purchase from "./js/Purchase";
import Order from "./js/Order";
import Buy_Test from "./js/Buy_Test";
import Header from "./js/Header";
import NotFoundPage from "./js/NotFoundPage";
import Help from "./js/Help";
import { AuthProvider } from './contexts/AuthenticationContext'

// Import App components
import OnboardingButton from './components/NavBar/Onboarding'

axios.defaults.headers.common['Authorization'] = 'Basic '+ Buffer.from(process.env.REACT_APP_API_TOKEN).toString('base64');

class App extends React.Component {
  constructor() {
    super()

    this.state = {
    }

  }


  componentDidMount() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log("Timezone = " + timezone);
    this.props.dispatch(updateTimeZone(timezone))

  }

  componentDidUpdate(prevProps, prevState) {
    
  }

  componentWillUnmount() {
    if (this.state.messageInterval) {
      clearInterval(this.state.messageInterval)
    }
  }

  render() {
    return (
      <AuthProvider>
      <HashRouter>
      <div className="App body-style">
        <Header></Header>
        <Routes>
          <Route exact path="/" element={<Events/>}/>
          <Route path="/account/*" element={<AccountPage/>}/>
          <Route path="/events" element={<Events/>}/>
          <Route path="/event/:id" element={<Event_Detail/>}/>
          <Route path="/event/:id/seating" element={<Seating/>}/>
          <Route path="/purchase/:order_id" element={<Purchase/>}/>
          <Route path="/order/:order_id" element={<Order/>}/>
          <Route path="/help/*" element={<Help/>}/>
          <Route path="/buy_test" element={<Buy_Test/>}/>
          <Route path="/organizer" element={<Home/>}/>
          <Route path="/organizer/create" element={<Buy_Test/>}/>
          <Route path="/organizer/detail/:id" element={<Detail/>}/>
          <Route path="/404" element={<NotFoundPage/>} />
          {/* <Redirect to="/404" /> */}
        </Routes>
      </div>
      </HashRouter>
      </AuthProvider>
    )
  }
}


const mapStateToProps = (state) => ({
  account_detail: state.account
});

export default connect(mapStateToProps)(App);
// export default App

