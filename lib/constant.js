"use strict";

let process = require("process");

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