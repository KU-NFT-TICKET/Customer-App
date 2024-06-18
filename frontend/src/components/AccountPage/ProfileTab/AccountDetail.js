import React from 'react'
import $ from 'jquery';
import axios from "axios"
import { BigNumber, ethers } from 'ethers'
import { connect } from "react-redux";
import { encode_thaiID, decode_thaiID, sortArrayByMultipleKeys } from '../../../features/function'
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class AccountDetail extends React.Component {
	 constructor (props) {
    super(props)

    this.state = {
    	thai_id: "",
      content_loading: 1,
    }

    this.load_content = this.load_content.bind(this)
  }

  load_content() {
    if (this.props.account_detail.wallet_accounts.length > 0) {
      let decrypt_thaiID = decode_thaiID(this.props.account_detail.thai_id, this.props.account_detail.wallet_accounts[0].toLowerCase())
      console.log(decrypt_thaiID)

      // console.log(orders_details)
      this.setState({
        thai_id: decrypt_thaiID,
        content_loading: 0,
      })
    }
  }

  componentDidMount() {
    // this.onConnected()
    // this.get_seats_detail(this.props.id)
    this.load_content()
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.account_detail.wallet_accounts !== this.props.account_detail.wallet_accounts ||
      prevProps.account_detail.thai_id !== this.props.account_detail.thai_id
    ) {
      this.load_content()
    }
  }

  render () {
  	const history_table_style = {
  		// color: 'snow',
  		// backgroundColor: "#ffffff",
  		// textAlign: 'center',
  		padding: "20px"
  	}
    if (this.state.content_loading === 1) {
      return (
        <div className="row" style={{'height': '100%'}}>
          {/*<img src={require('../../img/loading-black.gif')} />*/}
          <img className="loading-black" style={this.props.style.loading_size_profile}/>
        </div>
      )
    } else {
      return (
        <div className="row">
          <div className="col account-page profile-tab">
            <div className="row justify-content-center">
              <div className="col-sm-11 pt-5 text-start header">
                <h3 className="fw-bold">Profile</h3>
                <div className="row">
                  <div className="col py-4"></div>
                </div>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-sm-11 pt-5 text-start content">
                <div className="row py-3">
                  <div className="col-sm-4 label">
                    Username
                  </div>
                  <div className="col-sm-8 value">
                    {this.props.account_detail.username}
                  </div>
                </div>
                <div className="row py-3">
                  <div className="col-sm-4 label">
                    Citizen ID
                  </div>
                  <div className="col-sm-8 value" >
                    {this.state.thai_id}
                  </div>
                </div>
                <div className="row py-3">
                  <div className="col-sm-4 label">
                    Wallet Address
                  </div>
                  <div className="col-sm-8 value" style={{fontSize: "1.25em"}}>
                    {this.props.account_detail.wallet_accounts[0]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }
}


const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  style: state.style,
});

export default connect(mapStateToProps)(AccountDetail);