"use strict";

module.exports.required = {
	workspace: "Folder to build project before deploy on remote server",
	server: {
		user: "User to connect the remote server",
		host: "Server to deploy",
		to: "Absolute path where deploy"
	},
	repository: {
		url: "Source Git repository",
		branch: "Source Git branch"
	}
};

module.exports.default = {
	commands:  {
		local: [],
		remote: []
	},
	ignores: [],
	shared: {
		files: [],
		folders: []
	},
	releases: 3
};