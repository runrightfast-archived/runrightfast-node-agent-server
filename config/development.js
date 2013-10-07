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

(function() {
	'use strict';

	var defaultConfig = require('./default');

	module.exports = {

		couchbaseConnectionManager : {
			couchbase : {
				"host" : [ "localhost:8091" ],
				buckets : [ {
					"bucket" : "default",
					aliases : [ 'default', 'hawk' ]
				} ]
			},
			logLevel : 'WARN',
			connectionListener : function() {
				console.log('couchbaseConnectionManager.connectionListener : CONNECTED TO COUCHBASE');
			},
			connectionErrorListener : function(error) {
				console.error('couchbaseConnectionManager.connectionErrorListener : ' + error);
			}
		},
		hapiServer : {
			auth : {
				hawk : {
					couchbaseBucket : 'hawk',
					logLevel : 'WARN'
				}
			},
			plugins : {
				"runrightfast-process-monitor-hapi-plugin" : {
					logDir : defaultConfig.hapiServer.logDir
				},
				"runrightfast-process-monitor-logs-hapi-plugin" : {
					baseUri : '/api/process-monitor-logs',
					logLevel : 'WARN'
				}
			},
			logLevel : 'INFO'
		},
		cleanLogDirOnStartup : true
	};
}());