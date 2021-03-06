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

var path = require('path');
var pkginfo = require('./pkgInfo');
var logDir = path.join(__dirname, '..', 'logs', pkginfo.name + '-' + pkginfo.version);

module.exports = {
	hapiServer : {
		logLevel : 'WARN',
		stopTimeout : 5000,
		port : 7000,
		logDir : logDir
	},
	logManager : {
		logDir : logDir,
		maxNumberActiveFiles : 2,
		retentionDays : 5,
		logLevel : 'WARN'
	},
	cleanLogDirOnStartup : false
};