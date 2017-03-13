
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var userPlugin = require('mongoose-user');
var Schema = mongoose.Schema;

/**
 * User schema
 */

var UserSchema = new Schema({
  name: { type: String, default: '' }
});

/**
 * User plugin
 */

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */

//UserSchema.method({
//
//});

/**
 * Statics
 */
//
//UserSchema.static({
//
//});

/**
 * Register
 */

mongoose.model('User', UserSchema);
