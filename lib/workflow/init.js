"use strict";

const exec = require("../exec.js"),
	fs = require("fs");

module.exports = (options) => {
	return _run(options);
}

function _run(options) {
	return new Promise((resolve, reject) => {
		let config = options.config;

		if (config.repository !== null && config.repository.url !== null) {
			if (fs.existsSync(config.workspace) === true) {
				try {
					exec.local("git rev-parse --git-dir", {
						cwd: config.workspace,
					});
				} catch (err) {
					fs.rmdirSync(config.workspace);
				}

				exec.local([
					"git reset --hard",
					"git fetch --all",
					"git fetch --tags"
				].join(" && "), {
					cwd: config.workspace,
				});

				if (config.repository.branch !== null) {
					exec.local(
						`git remote set-branches --add origin ${config.repository.branch}`, {
							cwd: config.workspace,
						});

					exec.local(
						`[ -n "\`git show-ref refs/heads/${config.repository.branch}\`" ] && git checkout -q ${config.repository.branch} || git checkout -b ${config.repository.branch} origin/${config.repository.branch}`, {
						cwd: config.workspace,
					});

					exec.local(
						`git pull origin ${config.repository.branch}`, {
						cwd: config.workspace,
					});
				} else if (config.repository.tag !== null)  {
					exec.local(
						`git checkout -q refs/tags/${config.repository.tag}`, {
						cwd: config.workspace,
					});
					
					exec.local(
						`git pull origin ${config.repository.tag}`, {
						cwd: config.workspace,
					});
				}
			} else {
				let gitOption = "";
				if (config.repository.options.submodules === true) {
					gitOption += " --recursive";
				}

				exec.local(`git clone -b ${config.repository.branch} ${config.repository.url} --depth=1 ${config.workspace} ${gitOption}`);
			}
		} else {
			config.workspace = path.dirname(options.file);
		}

		resolve();
	}).then(() => {
		return options.config;
	});
}
