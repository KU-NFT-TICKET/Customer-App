import React from 'react'

class NotFoundPage extends React.Component {
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

    return (
        <div className="container-lg min-vh-100 d-flex align-items-center justify-content-center">
            <div className="row">
            <h1>Are you lost little one?</h1>
            <h5>Sorry, but there is nothing here.</h5> 
            </div>
        </div>
    )
  }
}

export default NotFoundPage;

