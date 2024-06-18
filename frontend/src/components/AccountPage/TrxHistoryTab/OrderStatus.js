import React from 'react'
import { connect } from "react-redux";
import 'bootstrap/dist/js/bootstrap.bundle';
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class OrderStatus extends React.Component {
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
    let status_shown = ""
    if (this.props.status === "completed") {
        status_shown = "Order Completed"
    } else if (this.props.status === "incomplete") {
        status_shown = "Order In Complete"
    }

    return (
        <div className={"d-inline-block px-3 py-1 fw-bold order-status "+this.props.status}>
            {status_shown}
        </div>
    )
  }
}


const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  status: ownProps.status
});

export default connect(mapStateToProps)(OrderStatus);