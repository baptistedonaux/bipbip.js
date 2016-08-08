"use strict";

const exec = require("../exec.js");
const helper = require("../helper.js");

module.exports = (config) => {
	return _lastRelease(config)
			.then(_mkdir)
			.then(_createRelease)
			.then(_rsync);
};

function _lastRelease(config) {
	return exec.remoteAsync(
		config.server,
		`ls -1t ${config.server.to}/releases | head -n 1`
		)
		.then((lastRelease) => {
			config.internal.lastRelease = lastRelease;

			return config;
		});
}

function _mkdir(config) {
	return exec.remoteAsync(
		config.server,
		helper.mkdir(
			`${config.server.to}/releases`,
			`${config.server.to}/shared`
			))
		.then(() => {
			return config;
		});
}

function _createRelease(config) {
	if (config.internal.lastRelease !== "") {
		let mkdirRemotePath = [
			`cp -R ${config.server.to}/releases/${config.internal.lastRelease}`,
			`${config.server.to}/releases/${config.internal.release}`
			].join(" ");

		return exec.remoteAsync(config.server, mkdirRemotePath)
				.then(() => {
					return config;
				});
	}

	return config;
}

function _rsync(config) {
	let cmd = [
		"rsync",
		"-az",
		"--delete",
		config.ignores.map(function (item) {
			return `--exclude=${item}`;
		}).join(" "),
		config.shared.files.map(function (item) {
			return `--exclude=${item}`;
		}).join(" "),
		config.shared.folders.map(function (item) {
			return `--exclude=${item}`;
		}).join(" "),
		config.workspace + "/",
		[
			[
				config.server.user, config.server.host].join("@"),
				`${config.server.to}/releases/${config.internal.release}`
			].join(":")
		].join(" ");
		
	return exec.localAsync(cmd)
			.then(() => {
				return config;
			});
}