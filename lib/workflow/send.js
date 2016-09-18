"use strict";

const exec = require("../exec.js"),
    helper = require("../helper.js");

module.exports = (config) => {
    return _lastRelease(config)
            .then(_mkdir)
            .then(_createRelease)
            .then(_rsync);
};

function _lastRelease(config) {
    return exec.remote(
        config.internal.write,
        config.internal.server,
        `ls -1t ${config.internal.server.to}/releases | head -n 1`
        )
        .then((lastRelease) => {
            config.internal.lastRelease = lastRelease;

            return config;
        });
}

function _mkdir(config) {
    return exec.remote(
        config.internal.write,
        config.internal.server,
        helper.mkdir(
            `${config.internal.server.to}/releases`,
            `${config.internal.server.to}/shared`
            ))
        .then(() => {
            return config;
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
            config.internal.server, mkdirRemotePath)
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
            [config.internal.server.user, config.internal.server.host].join("@"),
            `${config.internal.server.to}/releases/${config.internal.release}`
        ].join(":")
    ].join(" ");
        
    return exec.local(config.internal.write, cmd)
        .then(() => {
            return config;
        });
}