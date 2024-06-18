import React from 'react'
import axios from "axios"
import { BigNumber, ethers } from 'ethers'
import { v5 as uuidv5 } from 'uuid';
import withRouter from '../../../js/withRouter';
import { compose } from "redux";
import { connect } from "react-redux";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faDollarCircle, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { formatInTimeZone } from 'date-fns-tz';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import 'bootstrap/dist/js/bootstrap.bundle';
import { 
    createTicket
} from '../../../features/function'
import RedeemPopup from './RedeemPopup';
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

const RedeemSwal = withReactContent(Swal);

class Ticket extends React.Component {
	 constructor (props) {
    super(props)

    this.state = {
      is_mount: false,
      popupShown: false,
      confirmButtonText: 'Confirm'
    	// trx_list: new Map(),
      // event_detail_list: {},
      // content_loading: 1,
    }

    this.redeemClickHandler = this.redeemClickHandler.bind(this)
  }

  redeemClickHandler() {
    RedeemSwal.fire({
        title: <h1 className="h1 fw-bold text-black">Redeem Ticket</h1>,
        // html: ,
        iconColor: "#E3B04B",
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonColor: "#E3B04B",
        cancelButtonColor: "#7F786B",
        confirmButtonText: 'Confirm',
        cancelButtonText: "Cancel",
        customClass: {
            validationMessage: 'my-validation-message'
        },
        didOpen: () => this.setState({ popupShown: true }),
        didClose: () => this.setState({ popupShown: false }),
        // showLoaderOnConfirm: true,
        preConfirm: async () => {
            console.log(RedeemSwal.getConfirmButton())
            RedeemSwal.getConfirmButton().innerText = "Waiting for Permission..."

            const create_resp = await createTicket(this.props.purchase_form)
            let error_msg = ""
            if (create_resp.error === 0) {
                RedeemSwal.getConfirmButton().innerText = "Processing..."
                
                let resp = create_resp.resp
                let trx = resp.hash
                let gasPrice = resp.gasPrice
                let gasUsed = BigNumber.from(0)
                await resp.wait().then(async (receipt) => {
                    console.log('Transaction mined:', receipt);
        
                    if (receipt.status === 0) {
                      console.log('Transaction failed.');
                      error_msg = 'Error occurred while the order was mining. Please contact Admin.'
                    } else if (receipt.status === 1) {
                      console.log('Transaction succeeded.');
        
                      gasUsed = receipt.gasUsed
                      let totalFee = gasPrice.mul(gasUsed)

                      // update hash to Seats table (and Orders?)
                      let update_req = {
                        transaction: trx, 
                        owner: this.props.account_detail.wallet_accounts[0]
                      }
                      console.time("update seat api");
                      const update_ticket_status_resp = await axios.post(process.env.REACT_APP_API_BASE_URL+"/seats/"+this.props.ticket_id, update_req)
                      console.timeEnd("update seat api");
                      console.log(update_ticket_status_resp)

                      let uuid_input = this.props.account_detail.wallet_accounts[0] + Date.now();
                      let order_id = uuidv5(uuid_input, uuidv5.URL);
                      let func_name = "Redeem";
                      let create_req = {
                        order_id : order_id,
                        buyer : this.props.account_detail.wallet_accounts[0],
                        func_name : func_name,
                        price : 0,
                        fee : totalFee.toString(),
                        ticket_id : this.props.ticket_detail.ticket_id,
                        executed_date : (new Date()).toISOString(),
                      }
                      console.time("create order api");
                      const creat_order_resp = await axios.post(process.env.REACT_APP_API_BASE_URL+"/orders", create_req)
                      console.timeEnd("create order api");
                      console.log(creat_order_resp)

                      this.props.navigate('/account/tickets')
                    }
                  });
            } else {
                error_msg = create_resp.msg
                // if (error_msg === "Purchase is cancelled. Please try again.") {
                //     error_msg = "Redeem process is cancelled. Please try again."
                // }
            }

            if (error_msg !== "") {
                RedeemSwal.getConfirmButton().innerText = "Confirm"
                RedeemSwal.showValidationMessage(
                    "<span>" + error_msg + "</span>"
                )
            }
        },
        allowOutsideClick: () => !RedeemSwal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            RedeemSwal.fire('Redeem Success!', '', 'success')
            window.location.reload()
        }
    });
    
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
    let imgurl = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/" + this.props.event_detail.event_id + ".png"

    let seat_id = this.props.ticket_detail['seat_row'] + this.props.ticket_detail['seat_id']
    let show_datetime_event = formatInTimeZone(new Date(this.props.event_detail.date_event), this.props.account_detail.timezone, 'iiii d MMMM yyyy HH:mm')
    let ticket_status = this.state.ticket_status
    let price = ethers.utils.formatEther(this.props.ticket_detail['price'])
    let fee = (+ethers.utils.formatEther(this.props.fee)).toFixed(4)
    // let market_price = ethers.utils.formatEther(this.props.ticket_detail['market_price'])

    return (
      
      <div className="row my-2">
        <div className=" py-3 col ticket-box">
          <div className="row">
            <div className="col-sm-2" style={{width: "20.75%"}}>
              <img src={imgurl} style={{width: '8em', minHeight: '100%'}}/> 
            </div>
            <div className="col text-start">
              <h5 className="col fw-bold">{this.props.event_detail.event_name}</h5>
              <div className="row">
                <ul className="col">
                <li className="row py-1">
                    <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarDays} /></div>
                    <div className="col-sm-11 fw-bold">
                      {show_datetime_event}
                    </div>
                </li>
                <li className="row">
                    <div className="col-sm-1"><FontAwesomeIcon icon={faLocationDot} /></div>
                    <div className="col-sm-11 fw-bold">
                      {this.props.event_detail.venue}
                    </div>
                </li>
                </ul>
              </div>
              <div className="row">
                <div className="col-sm-8 pt-1 text-center seat-detail">
                  <div className="row">
                    <div className="col-sm-2 me-2">
                      <div className="row">
                        <span className="label">Seat</span>
                      </div>
                      <div className="row">
                        <span className="value">{seat_id}</span>
                      </div>
                    </div>
                    <div className="col-sm-2 mx-2">
                      <div className="row">
                        <span className="label">Zone</span>
                      </div>
                      <div className="row">
                        <span className="value">{this.props.ticket_detail['zone']}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
              <RedeemPopup 
                ticket_detail={this.props.ticket_detail} 
                fee={this.props.fee} 
                RedeemSwal={RedeemSwal} 
                popupShown={this.state.popupShown}
              />
            </div>
            <div className="col-sm-2">
              <button type="button" className="btn btn-warning fw-bold ticket-view" onClick={this.redeemClickHandler} >Redeem</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  ticket_detail: ownProps.ticket_detail,
  event_detail: ownProps.event_detail,
  purchase_form: ownProps.purchase_form,
  fee: ownProps.fee,
  load_tickets: ownProps.load_tickets,
});

export default compose(
  withRouter,
  connect(mapStateToProps)
)(Ticket);