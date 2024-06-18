import React from 'react'
import $ from 'jquery';

class ZoneAvailabilityBox extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  render () {
  	let zone_available_html = Object.keys(this.props.zoneAvailability).map((zone_name)=>{
      return (
          <tr>
            <th>{zone_name}</th>
            <td>{this.props.zoneAvailability[zone_name]}</td>
          </tr>
        )
    })
  	return (
  		<div>
  			<ul className="event-ul">
          <li className="row" style={{'marginBottom': '10px'}}>
            <h3>Zone Availability</h3>
          </li>
          <li className="row">
            <table>
                <tbody>
                {zone_available_html}
                </tbody>
              </table>
          </li>
        </ul>
      </div>
  	)
  }
}

export default ZoneAvailabilityBox;