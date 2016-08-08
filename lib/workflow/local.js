"use strict";

const exec = require("../exec.js");

module.exports = (config) => {
	return _run(config);
};

function _run(config) {
	if (config.commands.local.length > 0) {
		for (let i = 0; i < config.commands.local.length; i++) {
		    exec.local(config.commands.local[i], {
		    	cwd: config.workspace,
		    });
		}
	}

	return config;
}