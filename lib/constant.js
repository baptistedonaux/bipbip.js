"use strict";

module.exports.default = {
    "workspace": process.cwd(),
    "requirements": {
        local: [],
        remote: []
    },
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
};