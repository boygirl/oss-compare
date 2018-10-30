import React, { Component } from 'react';
import moment from '../node_modules/moment';

const respToJson = (response) => {
  const HTTP_ERROR_START = 400;
  if (response.status >= HTTP_ERROR_START) {
    throw new Error(`Response failed: ${response.status} - ${JSON.stringify(response)}`);
  }
  return response.json();
};

class ProjectPage extends Component {
  constructor() {
    super();
    this.state = {
      fetched: false
    }
  }

  // componentDidMount() {
  //   const baseUrl = `https://api.github.com/repos/FormidableLabs/${this.props.name}`
  //   const since = moment().subtract(7, "days").format("YYYY-MM-DDTHH:MM:SSZ");
  //   const allSince = `?state=all&since=${since}`;
  //   console.log(since)
  //   Promise.all([
  //     // Get recent issues
  //     fetch(`${baseUrl}/issues${allSince}`).then(respToJson),

  //     // Get all open pulls
  //     fetch(`${baseUrl}/pulls`).then(respToJson),

  //     // get recently closed pulls
  //     fetch(`${baseUrl}/pulls${allSince}`).then(respToJson)
  //   ])
  //   .then((datas) => {
  //     const [issues, openPulls, recentPulls] = datas;
  //     this.setState({
  //       issues, openPulls, recentPulls, fetched: true
  //     });
  //   })
  // }

  render() {
    console.log(this.state)
    return (
      <div>
        <h1>{this.props.name || "UNKNOWN"}</h1>
      </div>
    );
  }
}

export default ProjectPage;
