"use strict";

const exec = require("../exec.js");

module.exports = (config) => {
	return _run(config);
};

function _run(config) {
	return new Promise((resolve) => {
		if (config.commands.local.length > 0) {
			Promise
				.resolve(config.commands.local)
				.then((commands) => {
					return exec.local(commands.join(" && "), {
				    	cwd: config.workspace,
				    });
				}).then(() => {
					resolve();
				});
		} else {
			resolve();
		}
	}).then(() => {
		return config;
	});
}