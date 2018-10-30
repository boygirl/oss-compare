import React, { Component } from "react";
import ReactTable from "react-table";
import _ from "lodash";
import moment from "moment";
import "../node_modules/react-table/react-table.css";
import { getScaledColor } from "./util/color-scale";
import { repos } from "./config";

const cellStyle = { textAlign: "center" };
const repoNames = repos.map((repo) => repo.name);

const getDiffOptions = (data) => {
  const timestamps = data.map((d) => ({
    updated: d.updated, ago: moment(d.updated).fromNow(), diff: new Date() - d.updated
  }));
  const timeOptions = _.groupBy(timestamps, "ago");
  const oldest = timestamps[0];
  const filteredOptions = _.keys(timeOptions).reduce((memo, k) => {
    const option = timeOptions[k][0];
    return option.diff > moment.duration(24, "hours") ? memo.concat(option) : memo;
  }, []);
  return filteredOptions.length ? filteredOptions : [oldest];
};

const getDefaultOption = (options) => {
  if (options.length < 2) {
    return options[0];
  }
  const sortedOptions = _.sortBy(options, "diff");
  return _.find(sortedOptions, (o) => o.diff > moment.duration(7, "days")) || _.last(sortedOptions)
};

class ProjectTable extends Component {

  constructor(props){
    super(props);
    const options = getDiffOptions(this.props.data);
    const selected = getDefaultOption(options);
    const data = this.compareData(this.props.data, selected);
    this.state = { options, selected, data }
  }

  compareData(data, option) {
    const newData = _.last(data);
    const oldData = _.find(data, (d) => d.updated === option.updated)
    const newProjects = newData.projects.filter((d) => repoNames.indexOf(d.name) !==  -1);
    const projects = newProjects.map((project) => {
      const { timestamp, name, downloads, stars, issues, prs, pushed, status, maintainer } = project;
      const lastProject = _.find(oldData.projects, { name }) || {};
      return {
        timestamp, name, downloads, stars, issues, prs, pushed, status, maintainer,
        since: lastProject.timestamp,
        newDownloads: downloads - (lastProject.downloads || 0),
        newStars: stars - (lastProject.stars || stars),
        newIssues: issues - (lastProject.issues || issues),
        newPrs: prs - (lastProject.prs || prs)
      }
    });
    return {
      projects, updated: newData.updated, since: oldData.updated
    };
  }

  getCellStyle(value, worst, best = 0) {
    return {
      style: _.assign({}, cellStyle, { background: getScaledColor(value, [worst, best]) })
    };
  }

  getTable(data) {
    const columns = [{
      Header: "Name",
      accessor: "name",
      minWidth: 230,
      Cell: (props) => <span><a href={`#${props.value}`}>{props.value}</a></span>,
      getProps: () => ({ style: { fontWeight: "bold" } })
    }, {
      Header: "Last Commit",
      accessor: "pushed",
      minWidth: 150,
      Cell: (props) => <span>{moment(props.value).fromNow()}</span>,
      getProps: (state, rowInfo) => {
        const age = Date.now() - new Date(rowInfo.original.pushed);
        const max = moment.duration(2, "months");
        return {
          style: {
            textAlign: "center",
            background: getScaledColor(age, [max, 0])
          }
        };
      }
    }, {
      Header: " Weekly NPM Downloads",
      columns: [
        {
          Header: "Total",
          accessor: "downloads",
          Cell: (props) => (<span>{props.value === -1 ? "--" : props.value}</span>),
          getProps: (state, rowInfo) => {
            const max = _.maxBy(data.projects, "downloads").downloads;
            const val = rowInfo.original.downloads === -1 ? 0 : rowInfo.original.downloads;
            return this.getCellStyle(val, -1 * max, max)
          }
        }, {
          Header: "Δ",
          accessor: "newDownloads",
          Cell: (props) => {
            const { newDownloads, downloads } = props.original;
            const sign = newDownloads > 0 ? "+" : "-";
            const percent = Math.round((Math.abs(newDownloads / downloads) * 100));
            return (
              <span>
                {downloads === -1 ? "--" : `${sign}${percent}%`}
              </span>
            );
          },
          getProps: (state, rowInfo) => {
            const { newDownloads, downloads } = rowInfo.original;
            const percent = Math.round((newDownloads / downloads) * 100);
            return this.getCellStyle(percent, -20, 20)
          }
      }]
    }, {
      Header: "Github Stars",
      columns: [
        {
          Header: "Total",
          accessor: "stars",
          getProps: (state, rowInfo) => {
            const max = _.maxBy(data.projects, "stars").stars;
            return this.getCellStyle(rowInfo.original.stars, -1 * max, max)
          }
        }, {
          Header: "Δ",
          accessor: "newStars",
          getProps: (state, rowInfo) => this.getCellStyle(rowInfo.original.newStars, -5, 5)
      }]
    }, {
      Header: "Issues",
      columns: [
        {
          Header: "Total",
          accessor: "issues",
          getProps: (state, rowInfo) => this.getCellStyle(rowInfo.original.issues, 50)
        }, {
          Header: "Δ",
          accessor: "newIssues",
          getProps: (state, rowInfo) => this.getCellStyle(rowInfo.original.newIssues, 5, -5)
      }]
    }, {
      Header: "Open PRs",
      columns: [
        {
          Header: "Total",
          accessor: "prs",
          getProps: (state, rowInfo) => this.getCellStyle(rowInfo.original.prs, 10)
        }, {
          Header: "Δ",
          accessor: "newPrs",
          getProps: (state, rowInfo) => this.getCellStyle(rowInfo.original.newPrs, 5, -5)
      }]
    }];
    return (
      <ReactTable
        data={data.projects}
        getTheadThProps={() => ({ style: { whiteSpace: "normal"}})}
        columns={columns}
        resizable={false}
        defaultPageSize={data.projects.length}
        showPagination={false}
      />
    );
  }

  handleChange(evt) {
    const selected = _.find(this.state.options, { ago: evt.target.value})
    const data = this.compareData(this.props.data, selected)
    this.setState({ selected, data });
  }

  render() {
    return (
      <div>
        <div style={{ maxWidth: "85%", margin: "auto" }}>
          <div id="intro">
            GitHub + npm stats for our top projects.
            Differences in data are calculated from
            <select value={this.state.selected.ago} onChange={this.handleChange.bind(this)}>
              {this.state.options.map((o, i) => <option key={i} value={o.ago}>{o.ago}</option>)}
            </select>
          </div>
          {this.getTable(this.state.data)}
        </div>
      </div>
    );
  }
}

export default ProjectTable;
