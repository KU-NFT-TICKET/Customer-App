import React from 'react'
import { connect } from "react-redux";
import 'bootstrap/dist/js/bootstrap.bundle';
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class TicketStatus extends React.Component {
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
    if (this.props.status === "active") {
        status_shown = "Active"
    } else if (this.props.status === "on-sale") {
        status_shown = "On Sale"
    }

    return (
        <span className={"px-3 py-1 fw-bold ticket-status "+this.props.status}>
            {status_shown}
        </span>
    )
  }
}


const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  status: ownProps.status
});

export default connect(mapStateToProps)(TicketStatus);