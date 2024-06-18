import React, { useRef } from 'react'
import { BigNumber, ethers } from 'ethers'
import $ from 'jquery';
import axios from "axios"
import { ReactComponent as Avax } from '../img/Avalanche_AVAX_Black.svg';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import { formatInTimeZone } from 'date-fns-tz';
// import moment from 'moment-timezone';
import Swal from 'sweetalert2'
import { connect } from "react-redux";
import { 
  setupPurchaseResult, 
  updatePurchaseResult, 
  test_func 
} from '../features/purchase/purchaseSlice';
import { decode_thaiID, encode_thaiID, get_addProduct_gasFee, get_2ndHand_price } from '../features/function'

import SlideShow from './SlideShow'

const items = [
  { header: 'Header1', body: 'stuff 1' },
  { header: 'Header2', body: 'stuff 2' },
  { header: 'Header3', body: 'stuff 3' }
];


export class Buy_Test extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      is_mount: false,
      // purchase_results: {
      //   916: {result: "SUCCESS", transaction: null},
      //   917: {result: "LOADING", transaction: null},
      // },
      // seatSelection: [916, 917],
    }

    // this.buy_ticket = this.buy_ticket.bind(this) 
    this.onConnected = this.onConnected.bind(this)
    this.get_trx_detail = this.get_trx_detail.bind(this)
    this.get_bc_log = this.get_bc_log.bind(this)
    this.test_api = this.test_api.bind(this)
    this.get_wallets = this.get_wallets.bind(this)
    // this.buy_ticket_test = this.buy_ticket_test.bind(this)
  }

  async get_wallets() { 
    // Collect all wallets here
    // const wallets = [];
    // window.addEventListener('eip6963:announceProvider', e => wallets.push(e.detail));

    // // Request all EIP-6963 wallets announce themselves
    // window.dispatchEvent(new Event("eip6963:requestProvider"));

    // console.log(window.ethereum)

    // for (const wallet of wallets) {
    //   console.log({
    //     name: wallet.info.name,
    //     provider: wallet.provider // EIP-1193 provider, equivalent to window.ethereum
    //   });
    // }


    let thai_id = '1100501179531'
    // let thai_id = '3902476320346'
    let address = '0xf93dd1044015b2ddd42c7e2d9c674b04f2846781'
    let encoded = encode_thaiID(thai_id, address)
    console.log(encoded)
    let decoded = decode_thaiID(encoded, address)
    console.log(decoded)
    var insertItem = await axios.patch(process.env.REACT_APP_API_BASE_URL+"/account/" + address, {
      thai_id: encoded
    });
    console.log(insertItem)
  }

  async get_trx_detail(trx) { 
    const provider = new ethers.providers.Web3Provider(window.ethereum) 
    const txReceipt = await provider.getTransaction(trx)
    // const txReceipt = await provider.getTransactionReceipt(trx)
    console.log(txReceipt) 

    let gasPrice = txReceipt.gasPrice
    let gasLimit = txReceipt.gasLimit
    let gasFee = gasPrice.mul(gasLimit)
    console.log(ethers.utils.formatEther(gasPrice)) 
    console.log(gasLimit.toString()) 
    console.log(ethers.utils.formatEther(gasFee)) 

    // this.props.dispatch(test_func("a"))
    // console.log(format(new Date(), 'yyyy-MM-dd HH:mm:ss'))
    // await get_buyProduct_gasFee(1224)

    // const seats_detail = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/11/seats")

    // let market_prices = {}
    // let promises = []

    // for (let s_row of seats_detail.data) {
    //   if (s_row.in_marketplace !== null) {
    //     let promise = get_2ndHand_price(s_row.ticket_id)
    //       .then(market_price => {
    //         market_prices[s_row.ticket_id] = market_price['price'].toString()
    //       })
    //     promises.push(promise)
    //   }
    // }

    // await Promise.all(promises)
    // console.log(market_prices)
  }

  toggle_slider(order_id) {
    // let order_id = $(event.target).attr( "orderid" )
    this.setState({
      transactions: this.state.transactions.map((transaction, i) => {
        if (i === order_id) {
          return { ...transaction, isOpen: !transaction.isOpen };
        }
        return transaction;
      })
    });
  }

  async get_bc_log(){
    // // const provider = new ethers.providers.JsonRpcProvider();
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // const contract = new ethers.Contract(
    //   process.env.REACT_APP_TICKET_ADDRESS, 
    //   contractTicketPlace.output.abi, 
    //   provider
    // );

    // const eventFilter = contract.filters.addedProduct(
    //   null,
    //   null,
    //   this.props.account_detail.wallet_accounts[0]
    // ); // Replace 'MyEvent' with your event


    // let blockNumber = await provider.getBlockNumber()
    // console.log("Latest block number: ", blockNumber);

    // const fromBlock = 'earliest'
    // const toBlock = 'latest'
    // // const toBlock = 10
    // const logs = await contract.queryFilter(eventFilter, fromBlock, toBlock);

    // logs.forEach((log) => {
    //   console.log(contract.interface.parseLog(log));
    // });
    console.log(provider)
    console.log("log fin.")


    // let number = 31655009
    // let lot_value = 2048
    // for 
    // let array = new Array(Math.floor(number / lot_value)).fill(lot_value).concat(number % lot_value)
    // console.log(array)

  }

  async test_api(event) {
    let mode = $(event.target).val()
    if (mode === "all") {
      console.log("test all")
      let startTime = new Date();
      console.log(startTime + " start connect")
      // this.props.dispatch(test_func("a", "b"))
      const ownTickett = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/11/seats?zone=A1")
      let ticket_detail = ownTickett.data
      console.log(ticket_detail)
      let endTime = new Date();
      console.log(endTime + " end connect")
      let latency = endTime - startTime;
      console.log(`API call took ${latency} ms.`);
    } else {
      console.log("test lots")
      let bind = {'ticket_id': Array.from({length: 40}, (_, i) => i + 1206)}
      let startTime = new Date();
      console.log(startTime + " start connect")
      const ownTickett = await axios.post(process.env.REACT_APP_API_BASE_URL+"/get_seats", bind)
      let ticket_detail = ownTickett.data
      console.log(ticket_detail)
      let endTime = new Date();
      console.log(endTime + " end connect")
      let latency = endTime - startTime;
      console.log(`API call took ${latency} ms.`);
    }
  }

  async onConnected() { 
    console.log("connected")

    // console.log(window.ethereum)

    
    // let ticketId = 1221
    // let price = "150000000000000000"
    // let gas = "25000000000"
    // let fee = await get_addProduct_gasFee(ticketId, price, gas, "0xd2a6B642e2A53dE2Ea40D6B54Ce5e7DA1E51b4D5")
    // console.log(ethers.utils.formatEther(fee))

    // %Y-%m-%dT%T.%fZ
    // let date_str = format(new Date(), "yyyy-MM-dd'T'HH:MM:ss.SSSxxx")
    // console.log(date_str)

    // let ticket_id = 1226
    // let now = new Date()
    // console.log(now)
    // // let datetime_str = format(now, "yyyy-MM-dd'T'HH:MM:ss.SSS") + "Z"
    // let datetime_str = now.toISOString()
    // // let datetime_str = new Date()
    // console.log(datetime_str)
    // // let update_req = {
    // //   in_marketplace: datetime_str, 
    // //   seller: this.props.account_detail.wallet_accounts[0] 
    // // }
    // let update_req = {
    //   in_marketplace: null, 
    //   seller: null 
    // }
    // console.time("update seat api");
    // const update_ticket_status_resp = await axios.post(process.env.REACT_APP_API_BASE_URL+"/seats/"+ticket_id, update_req)
    // console.timeEnd("update seat api");
    // console.log(update_ticket_status_resp)

    // const order_detail = await axios.get(process.env.REACT_APP_API_BASE_URL+"/orders/4aeee0c8-f709-5884-90ed-6390b764bd69")
    // console.log(order_detail)


    // console.log(this.props.account_detail.timezone)
    // // const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // // console.log(timezone);
    // const timeZone = 'Asia/Bangkok';
    // let removed_date = new Date(order_detail.data[0].removed_date)
    // // removed_date = moment.tz(removed_date, 'Asia/Bangkok');
    // removed_date = formatInTimeZone(removed_date, timeZone, 'dd MMM yyyy HH:mm:ss');

    // console.log(new Date(order_detail.data[0].removed_date))
    // console.log(removed_date)

    // let post = {
    //   removed_date: 
    // }
    
    // const order_detail = await axios.post(
    //   process.env.REACT_APP_API_BASE_URL+"/orders/4aeee0c8-f709-5884-90ed-6390b764bd69",
    //   post
    // )
    // console.log(order_detail)


    // Collect all wallets here
    // const wallets = [];
    // window.addEventListener('eip6963:announceProvider', e => wallets.push(e.detail));

    // // Request all EIP-6963 wallets announce themselves
    // window.dispatchEvent(new Event("eip6963:requestProvider"));

    // for (const wallet of wallets) {
    //   console.log({
    //     name: wallet.info.name,
    //     provider: wallet.provider // EIP-1193 provider, equivalent to window.ethereum
    //   });
    // }
    
    // let ticketId = 1224
    // let price = "150000000000000000"
    // let gas = "25000000000"

    // let resp = await this.cancel_sell(ticketId)
    // // let resp = await this.sell_ticket(ticketId, price, gas)
    // // console.log(resp)

    // let resp = await this.get_trx_detail('0x148d1467a1936b350862936086f660a5f2144489e8d51ee8a0ad532cdddd143e')

    // await resp.wait().then((receipt) => {
    //   console.log('Transaction mined:', receipt);
    //   if (receipt.status === 0) {
    //     console.log('Transaction failed');
    //   } else if (receipt.status === 1) {
    //     console.log('Transaction succeeded');
    //   }
    // });

  }

  componentDidMount() {
    console.log('buy test didmount.')

    this.setState({
      is_mount: true
    });


    // this.get_events()
    // let setup = {
    //   916: {result: "SUCCESS", transaction: null},
    //   917: {result: "FAILED", transaction: null},
    //   918: {result: "FAILED", transaction: null},
    // }
    // this.props.dispatch(setupPurchaseResult(setup))
    // this.onConnected()
    let new_avax_price = "0.2"
    console.log(new_avax_price)
    let test_convert =  ethers.utils.parseUnits(new_avax_price).toString()
    console.log(test_convert)
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.is_mount !== this.state.is_mount) {
      console.log(prevState.is_mount + " -> " + this.state.is_mount)
      this.onConnected()
    }
  }

  render () {
    return (
      <div className="container">
        <div className="row">
          {/*<div className="ticket">Tickets</div>*/}
          {/*<div className="loading-text">Loading</div>*/}
          {/* <Avax  className="avax-red" /> */}
        </div>
        <div className="row">
          {/*<button type="button" className="btn btn-danger col-sm-2 offset-sm-5" onClick={this.test_api} value="all">ALL</button>*/}
          {/*<button type="button" className="btn btn-danger col-sm-2 offset-sm-5" onClick={this.test_api} value="lots">LOTS</button>*/}
          {/*<button type="button" className="btn btn-danger col-sm-2 offset-sm-5" onClick={this.get_wallets} >GET WALLET</button>*/}
          {/*<button type="button" className="btn btn-danger col-sm-2 offset-sm-5" onClick={this.sell_ticket}>SELL TICKET</button>*/}
          {/*<button type="button" className="btn btn-danger col-sm-2 offset-sm-5" onClick={this.buy_ticket_from_market}>BUY TICKET</button>*/}
          {/*<button type="button" className="btn btn-danger col-sm-2 offset-sm-5" onClick={this.cancel_sell}>CANCEL SELL</button>*/}
          {/*<button type="button" className="btn btn-danger col-sm-2 offset-sm-5" onClick={this.get_trx_detail}>ASDF</button>*/}


          
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  account_detail: state.account,
  events: state.events,
  purchase: state.purchase,
});

export default connect(mapStateToProps)(Buy_Test);

