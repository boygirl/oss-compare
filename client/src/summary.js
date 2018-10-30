import React, { Component } from "react";
import _ from "lodash";
import moment from "moment";
import { repos } from "./config";

const respToJson = (response) => {
  const HTTP_ERROR_START = 400;
  if (response.status === HTTP_ERROR_START) {
    throw new Error(`Response failed: ${response.status} - ${JSON.stringify(response)}`);
  }
  return response.json();
};

class Summary extends Component {
  constructor() {
    super();
    this.state = {
      fetched: false
    }
  }

  componentDidMount() {
    console.log("ComponentDidMount")
    const baseUrl = `https://api.github.com/search/issues?q=`
    const sourceUrl = this.props.projectName ?
      `repo:FormidableLabs/${this.props.projectName}` : "org:FormidableLabs";
    const since = `closed:>${moment().subtract(6, "days").format("YYYY-MM-DD")}`;
    fetch(`${baseUrl}${sourceUrl}+${since}&per_page=100`).then(respToJson)
      .then((data) => {
        this.setState({
          since,
          fetched: true,
          summaries: this.parseData(data.items)
        })
      });
  }

  componentWillUnmount() {
    console.log("UNMOUNT")
  }

  parseData(data) {
    const repoNames = this.props.projectName ? [this.props.projectName] : repos.map(r => r.name);
    return repoNames.reduce((memo, name) => {
      const repoEvents = data.filter((d) => _.includes(d.url, name));
      if (!repoEvents.length) {
        return memo;
      }
      const [prs, issues] = _.partition(repoEvents, (e) => e.pull_request !== undefined);
      return memo.concat({ name, prs, issues });
    }, [])
  }

  formatSummary(summary) {
    return (
      <div key={`summary-${summary.name}`}>
        {
          this.props.projectName ?
            null : <h3><a href={`#${summary.name}`}>{`${summary.name}:`}</a></h3>
        }
        {
          (
            <ul>
              {summary.issues.map((issue, i) => {
                return (
                  <li key={`${summary.name}-issue-${i}`}>
                    <a href={issue.html_url}>{`Closed issue #${issue.number}: ${issue.title}`}</a>
                  </li>
                );
              })}
              {summary.prs.map((pr, i) => {
                return (
                  <li key={`${summary.name}-pr-${i}`}>
                    <a href={pr.html_url}>{`Closed PR #${pr.number}: ${pr.title}`}</a>
                  </li>
                );
              })}
            </ul>
          )
        }
      </div>
    );
  }

  render() {
    console.log(this.state, this.props.projectName)
    return this.state.fetched ?
      (
        <div>
          <h2>{`Activity since ${moment(new Date(this.state.since)).format("MMM Do")}`}</h2>
          {this.state.summaries.map((summary) => {
            return this.formatSummary(summary);
          })}
        </div>
      ) :
      null;
  }
}

export default Summary;
