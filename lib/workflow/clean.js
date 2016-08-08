"use strict";

const exec = require("../exec.js");

module.exports = (config) => {
	return _ls(config);
};

function _ls(config) {
	return exec.remote(
		config.server,
		`ls -1dt ${config.server.to}/releases/* | tail -n +${(config.releases + 1).toString()} | xargs rm -rf`
		)
		.then(() => {
			return config;
		});
}