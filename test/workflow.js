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
                        expect(log).to.match(/date \+\"%Y%d%m%H%M%S\"/);
                        expect(log).to.match(/echo 'Local command'/);
                        expect(log).to.match(/mkdir -p .*\/releases .*\/shared/);
                        expect(log).to.match(/rsync -az --delete --delete-excluded  --exclude=file_to_share --exclude=folder_to_share .* test@localhost:.*\/releases\/\d{14}/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'mkdir -p .*\/shared\/folder_to_share\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'[ -L .*\/releases\/\d{14}\/folder_to_share ] || ln -s .*\/shared\/folder_to_share .*\/releases\/\d{14}\/folder_to_share\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'mkdir -p .*\/shared\/ && [ -e .*\/shared\/file_to_share ] || touch .*\/shared\/file_to_share && [ -L .*\/releases\/\d{14}\/file_to_share ] || ln -s .*\/shared\/file_to_share .*\/releases\/\d{14}\/file_to_share\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'cd .*\/releases\/\d{14} && echo \'Remote command\'\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'rm -f .*\/current && ln -s .*\/releases\/\d{14} .*\/current\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'cd .*\/releases\/\d{14} && echo \'Post deploy command\'\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'ls -1dt .*\/releases\/* | tail -n +4 | xargs rm -rf\'/);

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
                        expect(log).to.match(/date \+\"%Y%d%m%H%M%S\"/);
                        expect(log).to.match(new RegExp(`git clone -b v${pkg.version} https:\/\/github.com\/baptistedonaux\/bipbip.js.git --depth=1 \/tmp\/repository`));
                        expect(log).to.match(/echo 'Local command'/);
                        expect(log).to.match(/mkdir -p \/home\/test\/repository\/releases \/home\/test\/repository\/shared/);
                        expect(log).to.match(/rsync -az --delete --delete-excluded  --exclude=file_to_share --exclude=folder_to_share \/tmp\/repository\/ test@localhost:\/home\/test\/repository\/releases\/\d{14}/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'mkdir -p \/home\/test\/repository\/shared\/folder_to_share\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'[ -L \/home\/test\/repository\/releases\/\d{14}\/folder_to_share ] || ln -s \/home\/test\/repository\/shared\/folder_to_share \/home\/test\/repository\/releases\/\d{14}\/folder_to_share\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'mkdir -p \/home\/test\/repository\/shared\/ && [ -e \/home\/test\/repository\/shared\/file_to_share ] || touch \/home\/test\/repository\/shared\/file_to_share && [ -L \/home\/test\/repository\/releases\/\d{14}\/file_to_share ] || ln -s \/home\/test\/repository\/shared\/file_to_share \/home\/test\/repository\/releases\/\d{14}\/file_to_share\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'cd \/home\/test\/repository\/releases\/\d{14} && echo \'Remote command\'\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'rm -f \/home\/test\/repository\/current && ln -s \/home\/test\/repository\/releases\/\d{14} \/home\/test\/repository\/current\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'cd \/home\/test\/repository\/releases\/\d{14} && echo \'Post deploy command\'\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'ls -1dt \/home\/test\/repository\/releases\/* | tail -n +4 | xargs rm -rf\'/);

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
                        expect(log).to.match(/date \+\"%Y%d%m%H%M%S\"/);
                        expect(log).to.match(/git rev-parse --git-dir/);
                        expect(log).to.match(/git reset --hard && git fetch --all && git fetch --tags/);
                        expect(log).to.match(new RegExp(`git checkout -q refs/tags/v${pkg.version}`));
                        expect(log).to.match(/echo 'Local command'/);
                        expect(log).to.match(/mkdir -p \/home\/test\/repository\/releases \/home\/test\/repository\/shared/);
                        expect(log).to.match(/rsync -az --delete --delete-excluded  --exclude=file_to_share --exclude=folder_to_share \/tmp\/repository\/ test@localhost:\/home\/test\/repository\/releases\/\d{14}/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'mkdir -p \/home\/test\/repository\/shared\/folder_to_share\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'[ -L \/home\/test\/repository\/releases\/\d{14}\/folder_to_share ] || ln -s \/home\/test\/repository\/shared\/folder_to_share \/home\/test\/repository\/releases\/\d{14}\/folder_to_share\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'mkdir -p \/home\/test\/repository\/shared\/ && [ -e \/home\/test\/repository\/shared\/file_to_share ] || touch \/home\/test\/repository\/shared\/file_to_share && [ -L \/home\/test\/repository\/releases\/\d{14}\/file_to_share ] || ln -s \/home\/test\/repository\/shared\/file_to_share \/home\/test\/repository\/releases\/\d{14}\/file_to_share\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'cd \/home\/test\/repository\/releases\/\d{14} && echo \'Remote command\'\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'rm -f \/home\/test\/repository\/current && ln -s \/home\/test\/repository\/releases\/\d{14} \/home\/test\/repository\/current\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'cd \/home\/test\/repository\/releases\/\d{14} && echo \'Post deploy command\'\'/);
                        expect(log).to.match(/ssh -o StrictHostKeyChecking=no -p 22 test@localhost \'ls -1dt \/home\/test\/repository\/releases\/* | tail -n +4 | xargs rm -rf\'/);

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