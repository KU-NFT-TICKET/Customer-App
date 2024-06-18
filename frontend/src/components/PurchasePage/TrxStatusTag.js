import React from 'react'

class TrxStatusTag extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
        
    }

  }

  componentDidMount() {
    
  }

  componentDidUpdate(prevProps, prevState) {
    
  }

  componentWillUnmount() {
    
  }

  render() {
    let css_class = ""
    let text = ""
    if (this.props.trxStatus === "") {
      css_class = 'none'
      text = ''
    } else if (this.props.trxStatus === "SUCCESS") {
      css_class = 'success'
      text = 'SUCCESS'
    } else if (this.props.trxStatus === "FAILED") {
      css_class = 'failed'
      text = 'FAILED'
    } else if (this.props.trxStatus === "IN QUEUE") {
      css_class = 'in-queue'
      text = 'IN QUEUE'
    } else if (this.props.trxStatus === "WAITING FOR PERMISSION") {
      // status_html = <img src={require('../img/loading-black.gif')} style={{ "width": "50px" , "height": "30px", "margin": "auto"}} />
      css_class = 'wait-permission'
      text = 'WAITING FOR PERMISSION'
    } else if (this.props.trxStatus === "PAYMENT PROCESSING") {
      // status_html = <img src={require('../img/loading-black.gif')} style={{ "width": "50px" , "height": "30px", "margin": "auto"}} />
      css_class = 'processing'
      text = <div id="wave">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
    } 

    if (this.props.trxStatus === "FAILED") {
      let tooltip = this.props.error_msg
      return (
        <div className={'d-inline-block trx-status ' + css_class} data-toggle="tooltip" data-placement="top" title={tooltip}>{text}</div>
      )
    } else {
      return (
        <div className={'d-inline-block trx-status ' + css_class}>{text}</div>
      )
    }
  }
}

export default TrxStatusTag;

