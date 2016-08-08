"use strict";

const exec = require("../exec.js");
const path = require("path");
const helper = require("../helper.js");

module.exports = (config) => {
	return _mkdir(config)
		.then(_ln)
		.then(_touchAndShare)
		;
};

function _mkdir(config) {
	let folders = config.shared.folders.map(function(folder) {
		return `${config.server.to}/shared/${folder}`;
	});

	return exec.remote(
		config.server,
		helper.mkdir(folders.join(" "))
		)
		.then(() => {
			return config;
		});
}

function _ln(config) {
	let symbolics = config.shared.folders.map(function(folder) {
			return helper.ln(
				`${config.server.to}/shared/${folder}`,
				`${config.server.to}/releases/${config.internal.release}/${folder}`
				);
		});

	return exec.remote(
		config.server,
		symbolics.join(" && ")
		)
		.then(() => {
			return config;
		});
}

function _touchAndShare(config) {
	let commands = [];

	for (let i = config.shared.files.length - 1; i >= 0; i--) {
		let pathParsed = path.parse(config.shared.files[i]);

		commands.push(helper.mkdir(`${config.server.to}/shared/${pathParsed.dir}`));
		commands.push(helper.touch(`${config.server.to}/shared/${pathParsed.dir}/${pathParsed.base}`));
		commands.push(helper.ln(
			`${config.server.to}/shared/${config.shared.files[i]}`,
			`${config.server.to}/releases/${config.internal.release}/${config.shared.files[i]}`
			));
	}

	return exec.remote(
		config.server,
		commands.join(" && ")
		)
		.then(() => {
			return config;
		});
}