import React, { useRef } from 'react'
import { BigNumber, ethers } from 'ethers'
import $ from 'jquery';
import axios from "axios"
import format from 'date-fns/format';
import Swal from 'sweetalert2'
import { connect } from "react-redux";

class SlideShow extends React.Component {
  render() {
    const { header, body, number, openedNumber, setOpenedNumber } = this.props;
    const showStyle = {
      height: 'auto'
    };
    const hideStyle = {
      height: '0',
      paddingTop: '0',
      paddingBottom: '0'
    };
    return (
      <div
        className="header"
        onClick={() => setOpenedNumber(number !== openedNumber ? number : -1)}
      >
        {header}
        <div
          id="first"
          className="content"
          style={openedNumber === number ? showStyle : hideStyle}
        >
          {body}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  account_detail: state.account,
  events: state.events,
  purchase: state.purchase,
});

export default connect(mapStateToProps)(SlideShow);