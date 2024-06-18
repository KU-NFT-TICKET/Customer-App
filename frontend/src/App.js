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
import Buy_Test from "./js/Buy_Test";
import Header from "./js/Header";
import NotFoundPage from "./js/NotFoundPage";
import Help from "./js/Help";

// Import App components
import OnboardingButton from './components/NavBar/Onboarding'

axios.defaults.headers.common['Authorization'] = 'Basic '+ Buffer.from(process.env.REACT_APP_API_TOKEN).toString('base64');

class App extends React.Component {
  constructor() {
    super()

    this.state = {
      onboarding: new MetaMaskOnboarding(),
      is_mount: false,
    }

    // this.isExistAccount = this.isExistAccount.bind(this)
    this.connectMetaMask = this.connectMetaMask.bind(this)
    this.switchToAvalancheChain = this.switchToAvalancheChain.bind(this)
    this.check_available_walletaddress = this.check_available_walletaddress.bind(this)
  }

  async check_available_walletaddress(address) {
    const address_q_rst = await axios.get(process.env.REACT_APP_API_BASE_URL+"/account/"+address)
    console.log("check_address")
    console.log(address_q_rst)

    if (address_q_rst.data.length > 0) {
      this.props.dispatch(setLoginFlag(true))
      this.props.dispatch(setUsername(address_q_rst.data[0]['username']))
      this.props.dispatch(setThaiID(address_q_rst.data[0]["thai_id"]))
      // window.location.reload()
    } else {
      this.props.dispatch(setLoginFlag(false))
    }
  }

  connectMetaMask () {
    console.log("try to connect.")
    // Request to connect to the MetaMask wallet
    window.ethereum
      .request({ method: 'eth_requestAccounts' })
      .then(accounts => {
        this.props.dispatch(changeWalletAccount(accounts))
        if (accounts.length > 0) {
          this.check_available_walletaddress(accounts[0])
        }
      })
  }

  switchToAvalancheChain () {
    // Request to switch to the selected Avalanche network
    window.ethereum
      .request({
        method: 'wallet_addEthereumChain',
        params: [this.props.account_detail.AvalancheChain]
      })
  }

  componentDidMount() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log("Timezone = " + timezone);
    this.props.dispatch(updateTimeZone(timezone))
    this.setState({
      is_mount: true
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.is_mount !== this.state.is_mount) {
      console.log(this.state.is_mount)
      // componentDidMount
      if (MetaMaskOnboarding.isMetaMaskInstalled()) {
        this.props.dispatch(setMMInstalledFlag(true))
        this.connectMetaMask()

        // chain
        window.ethereum.request({method: 'net_version'}).then(chainId => {
          this.props.dispatch(changeChainId(chainId))
          console.log("net_version")
        })

        // Reload the site if the user selects a different chain
        window.ethereum.on('chainChanged', (chainId) => {
          this.props.dispatch(changeChainId(chainId))
          console.log("chainChanged")
          // window.location.reload()
        })  

        // Set the chain id once the MetaMask wallet is connected
        window.ethereum.on('connect', (connectInfo) => {
          const chainId = connectInfo.chainId
          this.props.dispatch(changeChainId(chainId))
          console.log("connect")
        })

        // Update the list of accounts if the user switches accounts in MetaMask
        window.ethereum.on('accountsChanged', accounts => {
          console.log("account did mount")
          if (accounts.length > 0 && this.props.account_detail.wallet_accounts[0] !== accounts[0]) {
            this.check_available_walletaddress(accounts[0])
          }
          this.props.dispatch(changeWalletAccount(accounts))
        })

      } else {
        this.props.dispatch(setMMInstalledFlag(false))
      }
    }

    if (this.props.account_detail.MetaMaskIsInstalled) {
      if (this.props.account_detail.wallet_accounts.length > 0) {
        // If the user is connected to MetaMask, stop the onboarding process.
        this.state.onboarding.stopOnboarding()
      }
    }
  }

  componentWillUnmount() {
    if (this.state.messageInterval) {
      clearInterval(this.state.messageInterval)
    }
  }

  render() {
    return (
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
    )
  }
}


const mapStateToProps = (state) => ({
  account_detail: state.account
});

export default connect(mapStateToProps)(App);
// export default App

