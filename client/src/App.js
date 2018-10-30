import React, { Component } from 'react';
import _ from "lodash";
import './App.css';
import { repos } from "./config";
import ProjectTable from "./project-table";
import ProjectPage from "./project-page";
import UpdateButton from "./update-button";
import Summary from "./summary";

const getRoute = (loc) => {
  return loc.hash ? loc.hash.substr(1) : loc.pathname.slice(1)
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      route: getRoute(window.location),
      fetched: false,
      data: []
    };
  }

  componentDidMount() {
    window.addEventListener("hashchange", () => {
      this.setState({
        route: getRoute(window.location)
      });
    });
    fetch("/data")
		.then(res => res.json())
		.then(data => {
      this.setState({
        fetched: true,
        data: data.allProjects,
      });
    })
  }

  getChildData(name) {
    const flatData = this.state.data.reduce((memo, curr) => {
      return memo.concat(curr.projects);
    }, []);
    return flatData.filter((d) => d.name === name);
  }

  getChild(route) {
    const repoNames = repos.map((r) => r.name);
    return repoNames.indexOf(route) !== -1 ?
      <ProjectPage name={route} data={this.getChildData(route)}/> :
      <ProjectTable data={this.state.data}/>;
  }

  updateData() {
    this.setState({ fetched: false });
    fetch("/update-data")
		.then(res => res.json())
		.then(data => {
      this.setState({
        fetched: true,
        data: data.allProjects,
      });
    })
  }

  getContent() {
    const updated = _.last(this.state.data).updated;
    return (
      <div>
        <UpdateButton updated={updated} updateData={this.updateData.bind(this)}/>
        {this.getChild(this.state.route)}
        <Summary projectName={this.state.route}/>
      </div>
    )
  }

  render() {
    return (
      <div>
        <h1 className="header-title"><a href={"/"}>OSS Compare</a></h1>
        {
          this.state.fetched ? this.getContent(): <p className="fetching">fetching data...</p>
        }
      </div>
    );
  }
}

export default App;
