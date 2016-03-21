"use strict";

module.exports.required = {
	workspace: "Folder to build project before deploy on remote server",
	server: {
		user: "User to connect the remote server",
		host: "Server to deploy",
		to: "Absolute path where deploy"
	}
};

module.exports.default = {
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