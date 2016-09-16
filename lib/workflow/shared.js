"use strict";

const exec = require("../exec.js"),
	helper = require("../helper.js"),
	path   = require("path");

module.exports = (config) => {
	return _mkdir(config)
		.then(_ln)
		.then(_touchAndShare)
		;
};

function _mkdir(config) {
	let folders = config.shared.folders.map(function(folder) {
		return `${config.internal.server.to}/shared/${folder}`;
	});

	return exec.remote(
        config.internal.write,
		config.internal.server,
		helper.mkdir(folders.join(" "))
	).then(() => {
		return config;
	});
}

function _ln(config) {
	let symbolics = config.shared.folders.map(function(folder) {
			return helper.ln(
				`${config.internal.server.to}/shared/${folder}`,
				`${config.internal.server.to}/releases/${config.internal.release}/${folder}`
				);
		});

	return exec.remote(
        config.internal.write,
		config.internal.server,
		symbolics.join(" && ")
	).then(() => {
		return config;
	});
}

function _touchAndShare(config) {
	let commands = [];

	for (let i = config.shared.files.length - 1; i >= 0; i--) {
		let pathParsed = path.parse(config.shared.files[i]);

		commands.push(helper.mkdir(`${config.internal.server.to}/shared/${pathParsed.dir}`));
		commands.push(helper.touch(`${config.internal.server.to}/shared/${pathParsed.dir}/${pathParsed.base}`));
		commands.push(helper.ln(
			`${config.internal.server.to}/shared/${config.shared.files[i]}`,
			`${config.internal.server.to}/releases/${config.internal.release}/${config.shared.files[i]}`
			));
	}

	return exec.remote(
        config.internal.write,
		config.internal.server,
		commands.join(" && ")
	).then(() => {
		return config;
	});
}