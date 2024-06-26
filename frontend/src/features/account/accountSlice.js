import { createSlice } from '@reduxjs/toolkit'
import { ethers } from 'ethers'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import MetaMaskOnboarding from '@metamask/onboarding'

var dec_chainId = 43113
var hex_chainId = ethers.utils.hexValue(dec_chainId)
// Avalanche Network information for automatic onboarding in MetaMask
const AVALANCHE_MAINNET_PARAMS = {
  chainId: '0xA86A',
  chainName: 'Avalanche Mainnet C-Chain',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18
  },
  rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://snowtrace.io/']
}
const AVALANCHE_TESTNET_PARAMS = {
  chainId: hex_chainId,
  chainName: 'Avalanche Testnet C-Chain',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18
  },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/']
}

// This code uses the Avalanche Test Network. If you want to use the main network, simply
// change this to AVALANCHE_MAINNET_PARAMS
const AVALANCHE_NETWORK_PARAMS = AVALANCHE_TESTNET_PARAMS

export const accountSlice = createSlice({
  name: 'account',
  initialState: {
    isConnected: false,
    wallet_accounts: [],
    chainId: null,
    MetaMaskIsInstalled: false,
    isAvalancheChain: false,
    AvalancheChain: AVALANCHE_NETWORK_PARAMS,
    isLogin: false,
    username: null,
    thai_id: "",
    account_list: {},
    timezone: "Asia/Bangkok",
  },
  reducers: {
    changeWalletAccount: (state, action) => {
      state.wallet_accounts = action.payload
    },
    changeChainId: (state, action) => {
      state.chainId = action.payload
      // Check if the chain id is the selected Avalanche chain id
      state.isAvalancheChain = (state.chainId && (state.chainId.toLowerCase() === AVALANCHE_NETWORK_PARAMS.chainId.toLowerCase() || state.chainId == dec_chainId))
      if (state.isAvalancheChain) {
        state.isConnected = true
      }
    },
    checkMetaMaskInstalled: state => {
      if (MetaMaskOnboarding.isMetaMaskInstalled()) {
          state.MetaMaskIsInstalled = true
      } else {
          state.MetaMaskIsInstalled = false
      }
    },
    setMMInstalledFlag: (state, action) => {
      state.MetaMaskIsInstalled = action.payload
    },
    setConnectFlag: (state, action) => {
      state.isConnected = action.payload
    },
    setLoginFlag: (state, action) => {
      console.log(action.payload)
      state.isLogin = action.payload
    },
    setUsername: (state, action) => {
      state.username = action.payload
    },
    setThaiID: (state, action) => {
      state.thai_id = action.payload
    },
    updateAccountList: (state, action) => {
      let account_list = state.account_list
      for (let address in action.payload) {
        account_list[address] = action.payload[address]
      }
      state.account_list = account_list
    },
    updateTimeZone: (state, action) => {
      state.timezone = action.payload
    },
  }
})

// Action creators are generated for each case reducer function
export const { 
  changeWalletAccount, 
  changeChainId, 
  checkMetaMaskInstalled, 
  setMMInstalledFlag, 
  setConnectFlag, 
  setLoginFlag, 
  setUsername,
  setThaiID,
  updateAccountList,
  updateTimeZone,
} = accountSlice.actions

export default accountSlice.reducer