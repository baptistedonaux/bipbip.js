"use strict";

let process = require("process");

module.exports.required = {
	server: {
		user: "User to connect the remote server",
		host: "Server to deploy",
		to: "Absolute path where deploy"
	}
};

module.exports.default = {
	"workspace": process.cwd(),
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