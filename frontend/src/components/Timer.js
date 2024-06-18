import React from 'react'

class Timer extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
        timeLeft: this.calculateTimeLeft(),
    }

    this.calculateTimeLeft = this.calculateTimeLeft.bind(this)
  }

  calculateTimeLeft() {
    const difference = +this.props.targetDate - +new Date();
    
    let timeLeft = {
        difference: difference,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        difference: difference,
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    // console.log(timeLeft)

    return timeLeft;
  };

  componentDidMount() {
    this.timer = setInterval(() => { 
    this.setState({ timeLeft: this.calculateTimeLeft() });
    }, 1000);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
        this.state.timeLeft.difference <= 1000 &&
        this.state.timeLeft.seconds === 0 &&
        prevState.timeLeft.seconds !== 0 &&
        typeof this.props.onTimerEnd === 'function'
      ) {
        console.log("Time ups!")
        this.props.onTimerEnd(); // Call the callback function when the timer ends
      }
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {

    const { timeLeft } = this.state;
    let minutes = String(timeLeft["minutes"]).padStart(2, '0')
    let seconds = String(timeLeft["seconds"]).padStart(2, '0')

    // const timerComponents = [];
    // Object.keys(timeLeft).forEach((interval) => {
    //     if (!timeLeft[interval]) {
    //         return;
    //     }

    //     timerComponents.push(
    //         <span key={interval}>
    //             {timeLeft[interval] + ':'}
    //         </span>
    //     );
    // });

    return (
    //   <span>{timerComponents.length ? timerComponents : <span>Time's up!</span>}</span>
      <span>{minutes + ":" + seconds}</span>
    )
  }
}

export default Timer;

