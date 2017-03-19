'use strict';

require('../../server').connection;

const dir = '../../';
const appPath = dir + 'app/';

const emulator = require(appPath + 'services/emulation');

var numberOfLocationChangePerSecond = 1;

setInterval(emulator.emulateLocationChange, 1000/numberOfLocationChangePerSecond);



