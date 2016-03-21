Bipbip.js is a simple tool to deploy, based on Node.js.

![Bipbip.js](logo.gif)

# Installation

```bash
$ npm install -g bipbip.js
```

# Run a deployment

```bash
$ bipbip my_env

# Run prod env
$ bipbip prod
```

# Configuration

bipbip.js takes the ```deploy.js``` default file. The file takes a default configuration and supports environments.

The environment called is merged with ```default``` environment.

```javascript
exports.config = {
  default: {
  },
  dev: {
  },
  preprod: {
  },
  prod: {
  },
  other_env: {
  }
}
```

## Environment variable

```javascript
workspace: "/path/to/workspace",
server: {
  user: "user",
  host: "server_to_deploy.io",
  to: "/path/to/deploy"
},
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
    // command to run locally
  ],
  remote: [
    // command to run after project send to remote server
  ],
  postDeploy: [
    // command to run after new release deployed
  ]
},
ignores: [
  // ignore files and folders to send
],
shared: {
  files: [
    // files list shared
  ],
  folders: [
    // folders list shared
  ]
},
releases: 3
```

## Required values

```javascript
{
  workspace: "Folder to build project before deploy on remote server",
  server: {
    user: "User to connect the remote server",
    host: "Server to deploy",
    to: "Absolute path where deploy"
  }
}
```

## Default values

```javascript
{
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

# Contributed

```bipbip.js``` is a simple project. No specific or complexe features will are developped. For bugs and features, open an [issue](https://github.com/baptistedonaux/bipbip.js/issues).