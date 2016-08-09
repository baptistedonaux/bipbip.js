"use strict";

const exec = require("../exec.js");

module.exports = (config) => {
	return _run(config);
};

function _run(config) {
	return exec.remote(
		config.internal.server,
		`cd ${config.internal.server.to}/releases/${config.internal.release} && ${config.commands.postDeploy.join(" && ")}`
		)
		.then(() => {
			return config;
		});
}