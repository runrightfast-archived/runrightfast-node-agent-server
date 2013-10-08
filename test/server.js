/**
 * Copyright [2013] [runrightfast.co]
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

'use strict';

var expect = require('chai').expect;
var lodash = require('lodash');
var Hapi = require('hapi');
var serverConfig = require('../config');
var config = require('config');

var restClient = null;

var initRestClient = function(callback) {
	var options = {
		baseUrl : 'http://localhost:7000',
		auth : {
			hawk : {
				credentials : {
					id : 'dh37fgj492je',
					key : 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
					algorithm : 'sha256'
				}
			}
		}
	};

	var cbConnManager = require('runrightfast-couchbase').couchbaseConnectionManager;
	var HawkAuthService = require('runrightfast-auth-service').HawkAuthService;

	var hawkAuthService = new HawkAuthService({
		couchbaseConn : cbConnManager.getBucketConnection(config.hapiServer.auth.hawk.couchbaseBucket),
		logLevel : config.hapiServer.auth.hawk.logLevel
	});

	hawkAuthService.createCredentials(function(err, credentials) {
		if (err) {
			callback(err);
		} else {
			options.auth.hawk.credentials = credentials;
			restClient = require('runrightfast-rest-client')(options);
			callback();
		}
	});

};

var fs = require('fs');
var file = require('file');
var path = require('path');

var logDir = file.path.abspath('temp/logs');

var handleResponseError = function(response, done) {
	var info = {
		statusCode : response.status.code,
		statusText : response.status.text,
		entity : response.entity
	};
	done(new Error('log request failed: ' + JSON.stringify(info)));
};

describe('Node Agent Server', function() {
	var composer = null;

	before(function(done) {
		composer = new Hapi.Composer(serverConfig.manifest);

		composer.compose(function(err) {
			if (err) {
				console.error('Failed composing servers : ' + err.message);
				callback(err);
			} else {
				console.log('Hapi is composed.');
				composer.start(function() {
					console.log('All servers started');
					file.mkdirs(logDir, parseInt('0755', 8), function(err) {
						if (err) {
							done(err);
						} else {
							initRestClient(done);
						}
					});
				});
			}
		});
	});

	after(function(done) {
		if (composer) {
			composer.stop({
				timeout : 1000
			}, function() {
				console.log('All servers stopped');
				done();
			});
		}
	});

	it('POST|PUT|GET /api/process-monitor-logs/logManager/logDir', function(done) {
		var payload = {
			logDir : logDir
		};

		restClient({
			method : 'POST',
			path : '/api/process-monitor-logs/logManager/logDir',
			entity : payload,
			headers : {
				"Content-Type" : 'application/json'
			}
		}).then(function(response) {
			console.log(response.headers);
			expect(response.status.code).to.equal(201);

			restClient({
				method : 'GET',
				path : '/api/process-monitor-logs/logManager/logDir/' + logDir
			}).then(function(response) {
				console.log(response.headers);
				console.log(response.entity);
				expect(response.status.code).to.equal(200);

				payload.logLevel = 'ERROR';
				restClient({
					method : 'PUT',
					path : '/api/process-monitor-logs/logManager/logDir',
					entity : payload,
					headers : {
						"Content-Type" : 'application/json'
					}
				}).then(function(response) {
					console.log(response.headers);
					expect(response.status.code).to.equal(200);
					done();
				}, function(response) {
					handleResponseError(response, done);
				});

			}, function(response) {
				handleResponseError(response, done);
			});

		}, function(response) {
			handleResponseError(response, done);
		});
	});

	it('GET /api/process-monitor-logs/logManager/ls/{logDir*}', function(done) {
		var payload = {
			logDir : logDir
		};

		restClient({
			method : 'POST',
			path : '/api/process-monitor-logs/logManager/logDir',
			entity : payload,
			headers : {
				"Content-Type" : 'application/json'
			}
		}).then(function(response) {
			console.log(response.headers);

			var logFileName = 'ops.' + process.pid + '.log.001';
			var logFile = path.join(logDir, logFileName);
			fs.writeFileSync(logFile, '\nSOME DATA');

			restClient({
				method : 'GET',
				path : '/api/process-monitor-logs/logManager/ls/' + logDir
			}).then(function(response) {
				console.log(response.headers);
				console.log(response.entity);
				expect(response.status.code).to.equal(200);
				done();
			}, function(response) {
				handleResponseError(response, done);
			});

		}, function(response) {
			handleResponseError(response, done);
		});
	});

	it('GET /api/process-monitor-logs/logManager/tail/{logDir*}', function(done) {
		var payload = {
			logDir : logDir
		};

		restClient({
			method : 'POST',
			path : '/api/process-monitor-logs/logManager/logDir',
			entity : payload,
			headers : {
				"Content-Type" : 'application/json'
			}
		}).then(function(response) {
			console.log(response.headers);

			var logFileName = 'ops.' + process.pid + '.log.001';
			var fileData = '';
			for ( var i = 0; i < 20; i++) {
				fileData += ('#' + i + '\n');
			}
			var logFile = path.join(logDir, logFileName);
			fs.writeFileSync(logFile, fileData);

			restClient({
				method : 'GET',
				path : '/api/process-monitor-logs/logManager/tail/' + logFile
			}).then(function(response) {
				console.log(response.headers);
				console.log(response.entity);
				expect(response.status.code).to.equal(200);
				done();
			}, function(response) {
				handleResponseError(response, done);
			});

		}, function(response) {
			handleResponseError(response, done);
		});
	});

	it('GET /api/process-monitor-logs/logManager/head/{logDir*}', function(done) {
		var payload = {
			logDir : logDir
		};

		restClient({
			method : 'POST',
			path : '/api/process-monitor-logs/logManager/logDir',
			entity : payload,
			headers : {
				"Content-Type" : 'application/json'
			}
		}).then(function(response) {
			console.log(response.headers);

			var logFileName = 'ops.' + process.pid + '.log.001';
			var fileData = '';
			for ( var i = 0; i < 20; i++) {
				fileData += ('#' + i + '\n');
			}
			var logFile = path.join(logDir, logFileName);
			fs.writeFileSync(logFile, fileData);

			restClient({
				method : 'GET',
				path : '/api/process-monitor-logs/logManager/head/' + logFile
			}).then(function(response) {
				console.log(response.headers);
				console.log(response.entity);
				expect(response.status.code).to.equal(200);
				done();
			}, function(response) {
				handleResponseError(response, done);
			});

		}, function(response) {
			handleResponseError(response, done);
		});
	});

	it('GET /api/process-monitor-logs/logManager/logDirs', function(done) {
		var payload = {
			logDir : logDir
		};

		restClient({
			method : 'POST',
			path : '/api/process-monitor-logs/logManager/logDir',
			entity : payload,
			headers : {
				"Content-Type" : 'application/json'
			}
		}).then(function(response) {
			console.log(response.headers);

			restClient({
				method : 'GET',
				path : '/api/process-monitor-logs/logManager/logDirs'
			}).then(function(response) {
				console.log(response.headers);
				console.log(response.entity);
				expect(response.status.code).to.equal(200);
				done();
			}, function(response) {
				handleResponseError(response, done);
			});

		}, function(response) {
			handleResponseError(response, done);
		});
	});

	it('DELETE /api/process-monitor-logs/logManager', function(done) {
		var payload = {
			logDir : logDir
		};

		restClient({
			method : 'POST',
			path : '/api/process-monitor-logs/logManager/logDir',
			entity : payload,
			headers : {
				"Content-Type" : 'application/json'
			}
		}).then(function(response) {
			console.log(response.headers);

			restClient({
				method : 'DELETE',
				path : '/api/process-monitor-logs/logManager/logDir/' + logDir
			}).then(function(response) {
				console.log(response.headers);
				expect(response.status.code).to.equal(200);

				restClient({
					method : 'GET',
					path : '/api/process-monitor-logs/logManager/logDir/' + logDir
				}).then(function(response) {
					done(new Error('Expected logDir to no longer be managed'));
				}, function(response) {
					console.log(response.entity);
					expect(response.status.code).to.equal(404);
					done();
				});

			}, function(response) {
				handleResponseError(response, done);
			});

		}, function(response) {
			handleResponseError(response, done);
		});
	});

	it('POST /api/process-monitor-logs/logManager/deleteAllNonActiveLogFiles/{logDir*}', function(done) {
		var payload = {
			logDir : logDir
		};

		restClient({
			method : 'POST',
			path : '/api/process-monitor-logs/logManager/logDir',
			entity : payload,
			headers : {
				"Content-Type" : 'application/json'
			}
		}).then(function(response) {
			console.log(response.headers);

			var logFileName = 'ops.' + process.pid + '999.log.001';
			var logFile = path.join(logDir, logFileName);
			fs.writeFileSync(logFile, '\nSOME DATA');

			restClient({
				method : 'GET',
				path : '/api/process-monitor-logs/logManager/ls/' + logDir
			}).then(function(response) {
				console.log(response.headers);
				console.log(response.entity);
				try {
					expect(response.status.code).to.equal(200);
					var f = lodash.find(response.entity,function(f){
						return f.file === logFileName;
					});
					expect(f).to.exist;
				} catch (err) {
					done(err);
				}

				restClient({
					method : 'POST',
					path : '/api/process-monitor-logs/logManager/deleteAllNonActiveLogFiles/' + logDir
				}).then(function(response) {
					console.log(response.headers);
					console.log(response.entity);
					console.log(response.status.code);
					expect(response.status.code).to.equal(202);

					setTimeout(function() {
						restClient({
							method : 'GET',
							path : '/api/process-monitor-logs/logManager/ls/' + logDir
						}).then(function(response) {
							console.log(response.headers);
							console.log(response.entity);
							try {
								expect(response.status.code).to.equal(200);
								var f = lodash.find(response.entity,function(f){
									return f.file === logFileName;
								});
								expect(f).to.not.exist;
								done();
							} catch (err) {
								done(err);
							}
						}, function(response) {
							handleResponseError(response, done);
						});
					}, 10);

				}, function(response) {
					handleResponseError(response, done);
				});

			}, function(response) {
				handleResponseError(response, done);
			});

		}, function(response) {
			handleResponseError(response, done);
		});
	});

});