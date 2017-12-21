"use strict";

const exec = require("../exec.js"),
    fs     = require("fs"),
    path   = require("path");

module.exports = (options) => {
    return _run(options);
};

function _run(options) {
    return new Promise((resolve, reject) => {
        let config = options.config;

        if (config.repository === null || config.repository.url === null) {
            config.workspace = path.dirname(options.file);

            resolve(config);
        } else {
            config.internal.write("\n>> Initialization");

            Promise.resolve(options.config)
                .then(_git)
                .then((config) => {
                    if (config.internal.gitClone === true) {
                        return Promise.resolve(config)
                            .then(_gitClone)
                            .then(() => {
                                return config;
                            });
                    } else {
                        return Promise.resolve(config)
                            .then(_gitRevParse)

                            .then(_gitReset)
                            .then(_gitFetchAll)
                            .then(_gitFetchTags)
                            
                            .then((config) => {
                                if (config.repository.branch !== null) {
                                    return Promise.resolve(config)
                                        .then(_gitRemoteSetBranches)
                                        .then(_gitShowRef)
                                        .then(_gitPullBranch);
                                } else if (config.repository.tag !== null) {
                                    return Promise.resolve(config)
                                        .then(_gitCheckoutTag)
                                        .then(_gitPullTag);
                                }
                            })
                            .then(() => {
                                return config;
                            });
                    }
                })
                .then((config) => {
                    resolve(config);
                }).catch((error) => {
                    reject(error);
                });
        }
    }).then((config) => {
        return config;
    });
}

function _git(config) {
    return new Promise((resolve) => {
        if (fs.existsSync(config.workspace) === true) {
            config.internal.gitClone = false;
        } else {
            config.internal.gitClone = true;
        }

        resolve(config);
    });
}

function _gitClone(config) {
    let gitOption = "";
    if (config.repository.options.submodules === true) {
        gitOption += " --recursive";
    }

    return exec.local(
        config.internal.write,
        `git clone -b ${config.repository.branch || config.repository.tag} ${config.repository.url} --depth=1 ${config.workspace} ${gitOption}`,
    {})
    .then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}

function _gitRevParse(config) {
    return exec.local(
        config.internal.write,
        "git rev-parse --git-dir",
        {
            cwd: config.workspace
        }
    ).then(() => {
        return config;
    }).catch(() => {
        fs.rmdirSync(config.workspace);
    });
}

function _gitReset(config) {
    return exec.local(
        config.internal.write,
        "git reset --hard",
        {
            cwd: config.workspace
        }
    ).then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}

function _gitFetchAll(config) {
    return exec.local(
        config.internal.write,
        "git fetch --all",
        {
            cwd: config.workspace
        }
    ).then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}

function _gitFetchTags(config) {
    return exec.local(
        config.internal.write,
        "git fetch --tags",
        {
            cwd: config.workspace
        }
    ).then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}

function _gitRemoteSetBranches(config) {
    return exec.local(
        config.internal.write,
        `git remote set-branches --add origin ${config.repository.branch}`, {
        cwd: config.workspace,
    }).then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}

function _gitShowRef(config) {
    return exec.local(
        config.internal.write,
        `[ -n "\`git show-ref refs/heads/${config.repository.branch}\`" ] && git checkout -q ${config.repository.branch} || git checkout -b ${config.repository.branch} origin/${config.repository.branch}`, {
        cwd: config.workspace,
    }).then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}

function _gitPullBranch(config) {
    return exec.local(
        config.internal.write,
        `git pull origin ${config.repository.branch}`, {
        cwd: config.workspace,
    }).then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}

function _gitPullTag(config) {
    return exec.local(
        config.internal.write,
        `git pull origin ${config.repository.tag}`, {
        cwd: config.workspace,
    }).then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}

function _gitCheckoutTag(config) {
    return exec.local(
        config.internal.write,
        `git checkout -q refs/tags/${config.repository.tag}`, {
        cwd: config.workspace,
    }).then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}
