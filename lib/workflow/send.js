"use strict";

const exec = require("../exec.js"),
    helper = require("../helper.js");

module.exports = (config) => {
    config.internal.write("\n>> Copy release on remote hosts");

    return _lastRelease(config)
            .then(_mkdir)
            .then(_createRelease)
            .then(_rsync);
};

function _lastRelease(config) {
    return exec.remote(
            config.internal.write,
            config.internal.server,
            {
                "cmd": `ls -1t ${config.internal.server.to}/releases | head -n 1`,
                "label": "Latest release deployed"
            }
        )
        .then((lastRelease) => {
            config.internal.lastRelease = lastRelease.replace(/\n/g, "");

            return config;
        })
        .catch((error) => {
            throw new Error(error);
        });
}

function _mkdir(config) {
    return exec.remote(
            config.internal.write,
            config.internal.server,
            {
                "cmd": helper.mkdir(
                    `${config.internal.server.to}/releases`,
                    `${config.internal.server.to}/shared`
                ),
                "label": "Build initial structure"
            }
        )
        .then(() => config)
        .catch((error) => {
            throw new Error(error);
        });
}

function _createRelease(config) {
    if (config.internal.lastRelease !== "") {
        let mkdirRemotePath = [
            `cp -R ${config.internal.server.to}/releases/${config.internal.lastRelease}`,
            `${config.internal.server.to}/releases/${config.internal.release}`
        ].join(" ");

        return exec.remote(
                config.internal.write,
                config.internal.server,
                {
                    "cmd": mkdirRemotePath,
                    "label": "Duplicate latest release deployed"
                }
            )
            .then(() => config)
            .catch((error) => {
                throw new Error(error);
            });
    }

    return config;
}

function _rsync(config) {
    let cmd = [
        "rsync",
        "-az",
        `-e 'ssh -p ${config.internal.server.port}'`,
        "--delete",
        "--delete-excluded",
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
            [config.internal.server.user, config.internal.server.host].join("@"),
            `${config.internal.server.to}/releases/${config.internal.release}`
        ].join(":")
    ].join(" ");
        
    return exec.local(config.internal.write, {
            "cmd": cmd,
            "label": `(${config.internal.server.user}@${config.internal.server.host}:${config.internal.server.port}) Updating remote source`
        })
        .then(() => config)
        .catch((error) => {
            throw new Error(error);
        });
}