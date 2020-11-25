#!/usr/bin/env node

const main = require('./bin/index')

main.run().then( function() {} ).catch( function(e) { console.error(e)})