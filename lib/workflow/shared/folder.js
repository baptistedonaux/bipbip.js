"use strict";

const exec = require("../../exec.js"),
    helper = require("../../helper.js");

module.exports = (config) => {
    return _run(config)
        .then(_mkdir)
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

function _mkdir(config) {
    let folders = config.shared.folders.map(function(folder) {
        return `${config.internal.server.to}/shared/${folder}`;
    });

    return exec.remote(
        config.internal.write,
        config.internal.server,
        helper.mkdir(folders.join(" "))
    ).then(() => config)
    .catch(error => {
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
        symbolics.join(" && ")
    ).then(() => config)
    .catch(error => {
        throw new Error(error);
    });
}
