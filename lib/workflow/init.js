"use strict";

const exec = require("../exec.js"),
	fs = require("fs"),
	path = require("path");

module.exports = (options) => {
	return _run(options);
};

function _run(options) {
	return new Promise((resolve) => {
		let config = options.config;

		if (config.repository !== null && config.repository.url !== null) {
			config.workspace = path.dirname(options.file);

			resolve(config);
		} else {
			Promise.resolve(options.config)
				.then(_git)
				.then((config) => {
					if (config.internal.gitClone === true) {
						Promise.resolve(config)
							.then(_gitClone)
							.then((config) => {
								resolve(config);
							});
					} else {
						Promise.resolve(config)
							.then(_gitRevParse)
							.then(_gitResetAndFetch)
							.then((config) => {
								if (config.repository.branch !== null) {
									Promise.resolve(config)
										.then(_gitRemoteSetBranches)
										.then(_gitShowRef)
										.then(_gitPullBranch)
										.then((config) => {
											resolve(config);
										});
								} else if (config.repository.tag !== null) {
									Promise.resolve(config)
										then(_gitCheckoutTag)
										then(_gitPullTag)
										.then((config) => {
											resolve(config);
										});
								}
							});
					}

					return config;
				})
				.then((config) => {
					resolve(config);
				});
		}
	}).then((config) => {
		return config;
	});
}

function _git(config) {
	return new Promise((resolve) => {
		if (fs.existsSync(config.workspace) === true) {
			config.internal.gitClone = true;
		} else {
			config.internal.gitClone = false;
		}

		resolve(config);

		resolve();
	});
}

function _gitClone(config) {
	return new Promise((resolve) => {
		let gitOption = "";
		if (config.repository.options.submodules === true) {
			gitOption += " --recursive";
		}

		exec.localAsync(`git clone -b ${config.repository.branch} ${config.repository.url} --depth=1 ${config.workspace} ${gitOption}`)
			.then(() => {
				resolve(config);
			});
	});
}

function _gitRevParse(config) {
	return new Promise((resolve, reject) => {
		exec.localAsync("git rev-parse --git-dir", {
			cwd: config.workspace,
		}).then(() => {
			resolve(config);
		}).catch((error) => {
			fs.rmdirSync(config.workspace);

			reject(error);
		});
	});
}

function _gitResetAndFetch(config) {
	return new Promise((resolve) => {
		exec.localAsync([
			"git reset --hard",
			"git fetch --all",
			"git fetch --tags"
		].join(" && "), {
			cwd: config.workspace,
		}).then(() => {
			resolve(config);
		});
	});
}

function _gitRemoteSetBranches(config) {
	return new Promise((resolve) => {
		exec.localAsync(`git remote set-branches --add origin ${config.repository.branch}`, {
			cwd: config.workspace,
		}).then(() => {
			resolve(config);
		});
	});
}

function _gitShowRef(config) {
	return new Promise((resolve) => {
		exec.localAsync(`[ -n "\`git show-ref refs/heads/${config.repository.branch}\`" ] && git checkout -q ${config.repository.branch} || git checkout -b ${config.repository.branch} origin/${config.repository.branch}`, {
			cwd: config.workspace,
		}).then(() => {
			resolve(config);
		});
	});
}

function _gitPullBranch(config) {
	return new Promise((resolve) => {
		exec.localAsync(`git pull origin ${config.repository.branch}`, {
			cwd: config.workspace,
		}).then(() => {
			resolve(config);
		});
	});
}

function _gitPullTag(config) {
	return new Promise((resolve) => {
		exec.localAsync(`git pull origin ${config.repository.tag}`, {
			cwd: config.workspace,
		}).then(() => {
			resolve(config);
		});
	});
}

function _gitCheckoutTag(config) {
	return new Promise((resolve) => {
		exec.localAsync(`git checkout -q refs/tags/${config.repository.tag}`, {
			cwd: config.workspace,
		}).then(() => {
			resolve(config);
		});
	});
}
