"use strict";

const exec = require("../exec.js");

module.exports = (config) => {
	return _run(config);
};

function _run(config) {
	return new Promise((resolve) => {
		if (config.commands.local.length > 0) {
			let promises = [];

			for (let i = 0; i < config.commands.local.length; i++) {
				promises.push(
					exec.local(config.commands.local[i], {
				    	cwd: config.workspace,
				    })
				);
			}

			Promise
				.all(promises)
				.then(() => {
					resolve(config);
				});
		} else {
			resolve(config);
		}
	}).then(() => {
		return config;
	});
}