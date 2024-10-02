"use strict";

const exec = require("../../exec.js"),
    helper = require("../../helper.js"),
    path   = require("path");

module.exports = (config) => {
    return _run(config)
        .then(_mkdirShared)
        .then(_mkdirRelease)
        .then(_ln)
        .catch((config) => {
            if (config instanceof Error) {
                throw config;
            }

            return config;
        });
};

function _run(config) {
    if (config.shared.folders.length === 0) {
        return Promise.reject(config);
    }

    return Promise.resolve(config);
}

function _mkdirShared(config) {
    const folders = config.shared.folders.map(function(folder) {
        return `${config.internal.server.to}/shared/${folder}`;
    });

    return exec.remote(
        config.internal.write,
        config.internal.server,
        {
            "cmd": helper.mkdir(folders.join(" ")),
            "label": "Creation of shared folders"
        }
    ).then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}

function _mkdirRelease(config) {
    const folders = config.shared.folders.map(function(folder) {
        return path.normalize(`${config.internal.server.to}/releases/${config.internal.release}/${path.dirname(folder)}`);
    });

    return exec.remote(
        config.internal.write,
        config.internal.server,
        {
            "cmd": helper.mkdir(folders.join(" ")),
            "label": "Creation of parents folder of shared folder in release"
        }
    ).then(() => config)
    .catch((error) => {
        throw new Error(error);
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
        {
            "cmd": symbolics.join(" && "),
            "label": "Configuration of shared folders"
        }
    ).then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}
