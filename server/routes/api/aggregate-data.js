const _ = require("lodash");
const fetch = require("node-fetch");
const config = require("../../../config");
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync("db.json")
const db = low(adapter);

const repoNames = config.repos.map((repo) => repo.name);
const packageNames = config.repos.map((repo) => repo.package || repo.name);
const repoQuery = repoNames.map((r) => `repo:FormidableLabs/${r}`).join("+");
const ghQuery = `org:FormidableLabs&per_page=100`;
const ghReposUrl = `https://api.github.com/search/repositories?q=${repoQuery}`;
const ghOpenPRsUrl = `https://api.github.com/search/issues?q=type:pr+state:open+${repoQuery}&per_page=100`;
const downloadsUrl = `https://api.npmjs.org/downloads/point/last-month/${packageNames.join(",")}`;

db.defaults({ data: [] }).write()

const respToJson = (response) => {
  const HTTP_ERROR_START = 400;
  if (response.status >= HTTP_ERROR_START) {
    throw new Error(`Response failed: ${response.status} - ${JSON.stringify(response)}`);
  }
  return response.json();
};

const formatDate = (d) => {
  if (!d) { return ""; }

  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

const formatData = (datas, timestamp) => {
  const [ghReposRaw, openPrsRaw, downloads] = datas;
  const ghRepos = (ghReposRaw || {}).items || [];
  const openPrs = (openPrsRaw || {}).items || [];

  // Create projects data object.
  // Start with GH repos and then add in npm stats, etc.
  const projects = ghRepos
    // Remove projects not in our curated list.
    .filter((proj) => repoNames.indexOf(proj.name) > -1)
    // Convert to final format.
    .map((proj) => {
      const name = proj.name;
      const repo = _.find(config.repos, { name }) || {};
      const prs = openPrs.filter((pr) => _.includes(pr.repository_url, name));
      const packageName = repo.package || repo.name;
      return {
        timestamp,
        name,
        status: repo.status || "unknown",
        maintainer: repo.maintainer || "none",
        downloads: (downloads[packageName] || {}).downloads || -1,
        stars: proj.stargazers_count,
        issues: proj.open_issues,
        prs: prs.length,
        pushed: proj.pushed_at // Note: Includes branch pushes.
      };
    });
  return projects;
}

const diffData = (oldData, newData) => {
  if (_.isEmpty(oldData)) {
    return newData;
  }
  return newData.map((project) => {
    const { timestamp, name, downloads, stars, issues, pushed, status, maintainer } = project;
    const lastProject = _.find(oldData, { name }) || {};
    return {
      timestamp, name, downloads, stars, issues, pushed, status, maintainer,
      since: lastProject.timestamp,
      newDownloads: downloads - (lastProject.downloads || 0),
      newStars: stars - (lastProject.stars || 0),
      newIssues: issues - (lastProject.issues || 0)
    }
  });
}

const formatResponse = (current, last) => {
  return {
    lastUpdated: current.updated,
    lastDiffed: last.updated,
    projects: diffData(last.projects, current.projects)
  };
};

module.exports = (app) => {
  app.get('/update-data', (req, res) => {
    Promise.all([
      // Get repo data.
      // https://developer.github.com/v3/search/#search-repositories
      fetch(ghReposUrl).then(respToJson),

      // get open PRs for all repos
      fetch(ghOpenPRsUrl).then(respToJson),
      // Get npm downloads for last month.
      // https://github.com/npm/registry/blob/master/docs/download-counts.md
      fetch(downloadsUrl).then(respToJson)
    ])
      // HTML tables.
      .then((datas) => {
        const timestamp = Date.now();
        const current = {
          id: timestamp.toString(),
          updated: timestamp,
          projects: formatData(datas, timestamp)
        };
        db.get("data")
          .push(current)
          .write()
        const allProjects = db.get("data").value();
        res.send({ allProjects });
      })
      // Error-handling
      .catch((err) => {
        console.error(err); // eslint-disable-line no-console
      });
  });

	app.get('/current-data', (req, res) => {
      const projects = db.get("data").value();
      const current = projects[projects.length - 1] || {};
      const last = projects[projects.length - 2] || {};
      res.send(formatResponse(current, last));
  });

  app.get('/data', (req, res) => {
    const allProjects = db.get("data").value();
    res.send({ allProjects });
  });
}
