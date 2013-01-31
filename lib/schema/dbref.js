/*!
 * Module dependencies.
 */
var SchemaType = require('../schematype');
var CastError = SchemaType.CastError;
var Oid = require('../types/objectid');
var Dbref = require('mongodb').BSONPure.DBRef;

/**
 * DBRef SchemaType constructor.
 * 
 * @param {String}
 *            key
 * @param {Object}
 *            options
 * @api private
 */

function DBRef(key, options) {
	SchemaType.call(this, key, options, 'DBRef');
}

/**
 * Inherits from SchemaType.
 */

DBRef.prototype.__proto__ = SchemaType.prototype;

/**
 * Check required
 * 
 * @api private
 */

DBRef.prototype.checkRequired = function(value) {
	return !!value && value instanceof Dbref;
};

/**
 * Overrides the getters application for the population special-case
 * 
 * @param {Object}
 *            value
 * @param {Object}
 *            scope
 * @api private
 */

DBRef.prototype.applyGetters = function(value, scope) {

	if (value && value instanceof Dbref)
		return value.oid;

	if (this.options.ref && value && value._id && value._id instanceof Oid)
		// means the dbref was populated
		return value;

	return SchemaType.prototype.applyGetters.call(this, value, scope);
};

/**
 * Overrides the getters application for the population special-case
 * 
 * @param {Object}
 *            value
 * @param {Object}
 *            scope
 * @api private
 */

DBRef.prototype.applySetters = function(value, scope) {
	if (this.options.ref && value && value._id && value._id instanceof Oid) {
		// means the dbref was populated
		return value;
	}

	return SchemaType.prototype.applySetters.call(this, value, scope);
};

/**
 * Casts to DBRef
 * 
 * @param {Object}
 *            value
 * @param {Object}
 *            scope
 * @param {Boolean}
 *            whether this is an initialization cast
 * @api private
 */
DBRef.prototype.cast = function(value, scope, init) {
	if (value === null || value == "*")
		return null;

	if (value instanceof Dbref)
		return value;

	if (!this.options)
		this.options = {};

	if (value instanceof Oid)
		// utils.toCollectionName(this.options.ref) utils is not public from mongoose
		return new Dbref(this.options.ref, value, this.options.db);// , mongoose.connection.name

	if (typeof value == 'string')
		return new Dbref(this.options.ref, Oid.fromString(value), this.options.db);// , mongoose.connection.name

	if (value && value._id instanceof Oid)
		return new Dbref((value.collection) ? value.collection.name : this.options.ref, value._id, this.options.db);// , mongoose.connection.name

	throw new CastError('db ref', value);
};

function handleSingle(val) {
	return this.cast(val);
}

function handleArray(val) {
	var self = this;
	return val.map(function(m) {
		return self.cast(m);
	});
}

DBRef.prototype.$conditionalHandlers = {
	'$ne' : handleSingle,
	'$in' : handleArray,
	'$nin' : handleArray,
	'$gt' : handleSingle,
	'$lt' : handleSingle,
	'$gte' : handleSingle,
	'$lte' : handleSingle
};

DBRef.prototype.castForQuery = function($conditional, val) {
	var handler;
	if (arguments.length === 2) {
		handler = this.$conditionalHandlers[$conditional];
		if (!handler)
			throw new Error("Can't use " + $conditional + " with DBRef.");
		return handler.call(this, val);
	} else {
		val = $conditional;
		return this.cast(val);
	}
};

/**
 * Module exports.
 */
module.exports = DBRef;

