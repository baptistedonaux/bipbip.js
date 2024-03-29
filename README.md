# Bipbip.js - Simple deployment tool

[![Build Status](https://travis-ci.org/baptistedonaux/bipbip.js.svg?branch=0.11)](https://travis-ci.org/baptistedonaux/bipbip.js)
[![DUB](https://img.shields.io/dub/l/vibe-d.svg)](LICENSE)

Bipbip.js is a simple tool to deploy, based on Node.js.

![Bipbip.js](bipbip-logo-text.svg)

## Installation

```bash
$ npm install -g bipbip.js@0.11.*
```
## Getting Started
### Run a deployment
```bash
$ bipbip <env>

# Run prod env
$ bipbip prod
```

### Configuration
bipbip.js takes the ```deploy.js``` default file. The file takes a default configuration and supports environments.

The environment called is merged with ```default``` environment.

```javascript
exports.config = {
  default: {
  },
  <env1>: {
  },
  <env2>: {
  }
}
```

### Environment variables
```javascript
workspace: "/path/to/workspace",
// empty string in releaseDir is used to deploy current folder (workspace)
releaseDir: "",
requirements: {
    local: [],
    remote: []
},
servers: [{
  user: "user",
  host: "server_to_deploy.io",
  to: "/path/to/deploy",
  port: 22
}],
repository: {
  url: "git@github.com:baptistedonaux/bipbip.js.git",

  // branch and tag should not be sets simultaneously
  branch: null,
  tag: null,
  
  options: {
    // clone submodule
    submodules: true|false
  }
},
commands:  {
  local: [
    // local commands to run (before send to remote server)
  ],
  remote: [
    // remote commands to run (after project send to remote server)
  ],
  postDeploy: [
    // remote commands to run (after new release deployed)
  ]
},
ignores: [
  // ignore files/folders
],
shared: {
  files: [
    // files shared
  ],
  folders: [
    // folders shared
  ]
},
releases: 3
```

#### Required values
```javascript
{
  servers: [{
    user: "User to connect the remote server",
    host: "Server to deploy",
    to: "Absolute path where deploy"
  }]
}
```

#### Default values
```javascript
{
  workspace: require("process").cwd(),
  requirements: {
    local: [],
    remote: []
  },
  servers: [{
    port: 22
  }],
  repository: {
    branch: null,
    options: {
      submodules: false
    },
    tag: null,
    url: null
  },
  commands:  {
    local: [],
    remote: [],
    postDeploy: []
  },
  ignores: [],
  shared: {
    files: [],
    folders: []
  },
  releases: 3
}
```

## Test
```bash
$ npm test
```

## Contribute
```bipbip.js``` is a simple project. No specific or complexe features will are developped. For bugs and features, open an [issue](https://github.com/baptistedonaux/bipbip.js/issues).
