"use strict";

const expect = require("expect.js"),
	Bipbip = require('../lib/index.js'),
    logger = require("../lib/logger.js"),
    pkg = require("../package.json");

describe("Workflow", function() {
    describe("Without repository", function() {
    	it("Check instruction", function(done) {
    		let log = "";
            const writter = new logger({
                data: (chunk) => {
                    log += `\n${chunk}`;
                },
                error: (error) => {
                    done(new Error(error));
                },
                end: () => {
                    try {
                        expect(log).to.match(/which git/);
                        expect(log).to.match(/which rsync/);
                        expect(log).to.match(/which ssh/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'which rsync || exit 1\'/);
                        expect(log).to.match(/Release name/);
                        expect(log).to.match(/echo 'Local command'/);
                        expect(log).to.match(/Plug folders\/files to share/);
                        expect(log).to.match(/Copy release on remote hosts/);

                        done();
                    } catch (err) {
                        done(new Error(err));
                    }
                }
            });

    		Bipbip(`${__dirname}/workflow.deploy.js`, "noRepository", writter);
        });
    });

    describe("With repository", function() {
        it("Step 1 - clone command", function(done) {
            let log = "";

            const writter = new logger({
                data: (chunk) => {
                    log += `\n${chunk}`;
                },
                error: (error) => {
                    done(new Error(error));
                },
                end: () => {
                    try {
                        expect(log).to.match(/which ssh/);
                        expect(log).to.match(/which rsync/);
                        expect(log).to.match(/which git/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'which rsync || exit 1\'/);
                        expect(log).to.match(/\d{14}/);
                        expect(log).to.match(/Release name/);
                        expect(log).to.match(/Initialization/);
                        expect(log).to.match(/echo 'Local command'/);
                        expect(log).to.match(/Plug folders\/files to share/);
                        expect(log).to.match(/Copy release on remote hosts/);

                        done();
                    } catch (err) {
                        done(new Error(err));
                    }
                }
            });

            Bipbip(`${__dirname}/workflow.deploy.js`, "repository", writter);
        });

        it("Step 2 - pull command", function(done) {
            let log = "";

            const writter = new logger({
                data: (chunk) => {
                    log += `\n${chunk}`;
                },
                error: (error) => {
                    done(new Error(error));
                },
                end: () => {
                    try {
                        expect(log).to.match(/which git/);
                        expect(log).to.match(/which rsync/);
                        expect(log).to.match(/Release name/);
                        expect(log).to.match(/Initialization/);
                        expect(log).to.match(/echo 'Local command'/);
                        expect(log).to.match(/Plug folders\/files to share/);
                        expect(log).to.match(/Copy release on remote hosts/);

                        done();
                    } catch (err) {
                        done(new Error(err));
                    }
                }
            });

            Bipbip(`${__dirname}/workflow.deploy.js`, "repository", writter);
        });
    });
});