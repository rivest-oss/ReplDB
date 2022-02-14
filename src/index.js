const path = require(`path`);
const axios = require(`axios`);

/**
 * A Replit Database connection
 * @class
 * @constructor
 * @public
 */
class ReplitDatabase {
	/**
	 * Initialize a connection to a Replit Database
	 * @param {String} baseURL Replit database URL (using REPLIT_DB_URL variable environment by default)
	 */
	constructor(baseURL=process.env.REPLIT_DB_URL) {
		if(!baseURL) throw new Error(`You must set an valid Replit Database URL.`);
		if(typeof baseURL !== `string`) throw new TypeError(`You must set an valid Replit Database URL, nor ${typeof baseURL}.`);

		this.baseURL = baseURL;
	}

	/**
	 * Get a key's value
	 * @param {String} key Key's name
	 * @async
	 * @returns {Promise<any|Error>}
	 */
	async get(key) {
		return new Promise(async(resolve, reject) => {
			if(!key) return reject(new Error(`You must set a key name.`));
			if(typeof key !== `string`) return reject(new Error(`Key's name must be a String, nor ${typeof key}.`));

			axios.get(`${this.baseURL}/${encodeURIComponent(key)}`).then(async res => {
				try {
					return resolve(JSON.parse(res.data));
				} catch(err) {
					return resolve(res.data);
				}
			}).catch(reject);
		});
	}

	/**
	 * Check if the database has a key
	 * @param {String} key Key's name
	 * @async
	 * @returns {Promise<Boolean|Error>}
	 */
	async has(key) {
		return new Promise(async(resolve, reject) => {
			this.get(key).then(async value => {
				if(value === undefined) return resolve(false);
				return resolve(true);
			}).catch(async err => {
				if(err.response && err.response.status == 404) return resolve(false);
				return reject(!err.response ? err : err.response);
			});
		});
	}

	/**
	 * Check if the database has a key ('has' alias)
	 * @see #has
	 * @param {String} key Key's name
	 * @async
	 * @returns {Promise<Boolean|Error>}
	 */
	async check(key) {
		return this.has(key);
	}

	/**
	 * Check if a database key is empty
	 * @param {String} key Key's name
	 * @async
	 * @returns {Promise<Boolean|Error>}
	 */
	async empty(key) {
		return new Promise(async(resolve, reject) => {
			return this.has(key).then(bool => resolve(bool === false)).catch(reject);
		});
	}
	
	/**
	 * Set a key
	 * @param {String} key Key's name
	 * @param {any} [value] Key's value
	 * @async
	 * @returns {Promise<String|Error>}
	 */
	async set(key, value) {
		return new Promise(async(resolve, reject) => {
			if(!key) return reject(new Error(`You must set a key name.`));
			if(typeof key !== `string`) return reject(new Error(`Key's name must be a String, nor ${typeof key}.`));
			
			// if(!value) return reject(new Error(`You must set a key's value.`));

			return axios.post(this.baseURL, `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`).then(async() => resolve(key)).catch(reject);
		});
	}

	/**
	 * Set a key ('set' alias)
	 * @see #set
	 * @param {String} key Key's name
	 * @param {any} [value] Key's value
	 * @async
	 * @returns {Promise<String|Error>}
	 */
	async post(key, value) {
		return this.set(key, value);
	}

	/**
	 * Set a key ('set' alias)
	 * @see #set
	 * @param {String} key Key's name
	 * @param {any} [value] Key's value
	 * @async
	 * @returns {Promise<String|Error>}
	 */
	async put(key, value) {
		return this.set(key, value);
	}

	/**
	 * Update a key value
	 * @param {String} key Key's name
	 * @param {any} value Key's updated value
	 * @async
	 * @returns {Promise<any|Error>}
	 */
	async update(key, value) {
		return new Promise(async(resolve, reject) => {
			if(!key) return reject(new Error(`You must set a key name.`));
			if(typeof key !== `string`) return reject(new Error(`Key's name must be a String, nor ${typeof key}.`));
	
			if(typeof value !== `object`) return this.set(key, value);

			this.get(key).then(async oldValue => {
				const operators = {
					$set: val => {
						const [ [x, y] ] = Object.entries(val);

						oldValue[x] = y;
					},

					$add: val => {
						const [ [x, y] ] = Object.entries(val);

						switch(typeof oldValue[x]) {
							case `string`: oldValue[x] += y; break;
							case `number`: oldValue[x] += y; break;
							case `object`: Array.isArray(oldValue[x]) ? oldValue[x].push(y) : null; break;
							default: break;
						}
					},

					$sub: val => {
						const [ [x, y] ] = Object.entries(val);

						switch(typeof oldValue[x]) {
							case `string`: oldValue[x] = oldValue[x].slice(0, Math.abs(y) * -1); break;
							case `number`: oldValue[x] -= y; break;
							case `object`: Array.isArray(oldValue[x]) ? oldValue[x] = oldValue[x].slice(0, Math.abs(y) * -1) : null; break;
							default: break;
						}
					},
				};

				Object.entries(value)
					.filter(x => operators[x.at(0)] !== undefined)
					.forEach(entry => {
						operators[entry.at(0)](entry.at(1));
					});

				Object.entries(value)
					.filter(x => operators[x.at(0)] === undefined)
					.forEach(entry => {
						oldValue[entry.at(0)] = entry.at(1);
				});

				return this.set(key, oldValue).then(resolve).catch(reject);
			}).catch(reject);
		});
	}

	/**
	 * Edit a key value ('update' alias)
	 * @see #update
	 * @param {String} key Key's name
	 * @param {any} value Key's updated value
	 * @async
	 * @returns {Promise<any|Error>}
	 */
	async edit(key, value) {
		return this.update(key, value);
	}

	/**
	 * Patch a key value
	 * @param {String} key Key's name
	 * @param {any} value Key's updated value
	 * @async
	 * @returns {Promise<String|Error>}
	 */
	async patch(key, value) {
		return new Promise(async(resolve, reject) => {
			if(!key) return reject(new Error(`You must set a key name.`));
			if(typeof key !== `string`) return reject(new Error(`Key's name must be a String, nor ${typeof key}.`));
	
			if(typeof value !== `object`) return this.set(key, value);
			
			this.get(key).then(async oldValue => {
				Object.entries(value).forEach(entry => {
					oldValue[entry.at(0)] = entry.at(1);
				});

				return this.set(key, oldValue).then(resolve).catch(reject);
			}).catch(reject);
		});
	}

	/**
	 * Delete a key
	 * @param {String} key Key's name
	 * @async
	 * @returns {Promise<String|Error>}
	 */
	async delete(key) {
		return new Promise(async(resolve, reject) => {
			if(!key) return reject(new Error(`You must set a key name.`));
			if(typeof key !== `string`) return reject(new Error(`Key's name must be a String, nor ${typeof key}.`));
			
			return axios.delete(`${this.baseURL}/${encodeURIComponent(key)}`).then(async() => resolve(key)).catch(reject);
		});
	}

	/**
	 * Remove a key ('delete' alias)
	 * @see #delete
	 * @param {String} key Key's name
	 * @async
	 * @returns {Promise<String|Error>}
	 */
	async remove(key) {
		return this.delete(key);
	}

	/**
	 * List all keys (or keys that starts with a custom prefix)
	 * @param {String} [prefix] Prefix
	 * @async
	 * @returns {Promise<String[]|Error>}
	 */
	async list(prefix=``) {
		return new Promise(async(resolve, reject) => {
			if(typeof prefix !== `string`) return reject(new Error(`Prefix must be a String, nor ${typeof prefix}.`));

			return axios.get(`${this.baseURL}?prefix=${encodeURIComponent(prefix)}`).then(async res => resolve(res.data.split(`\n`))).catch(reject);
		});
	}

	/**
	 * List all keys (or keys that starts with a custom prefix, 'list' alias)
	 * @see #list
	 * @param {String} [prefix] Prefix
	 * @async
	 * @returns {Promise<String[]|Error>}
	 */
	async prefix(prefix=``) {
		return this.list(prefix);
	}

	/**
	 * Get all keys (or keys that starts with a custom prefix)
	 * @param {String} prefix Prefix
	 * @async
	 * @returns {Promise<any[]|Error>}
	 */
	async getAll(prefix=``) {
		return new Promise(async(resolve, reject) => {
			this.list(prefix).then(async keys => {
				const promises = [];

				keys.forEach(async key => {
					promises.push(new Promise(async(resolve, reject) => {
						this.get(key).then(async value => {
							return resolve([ key, value ]);
						}).catch(reject);
					}));
				});

				return Promise.all(promises).then(async res => resolve(Object.fromEntries(res))).catch(reject);
			}).catch(reject);
		});
	}

	/**
	 * Set all keys (or keys that starts with a custom prefix, or specified keys in Array)
	 * @param {String|Array} prefixOrList Prefix or keys' names Array
	 * @param {String|Array|Function|any} values New keys' values. Can be String (all keys have the same value), Array (give keys a value from that array in order) or Callback Function.
	 * @async
	 * @returns {Promise<any[]|Error>}
	 */
	async setAll(prefixOrList=``, values) {
		return new Promise(async(resolve, reject) => {
			async function doSetAll(keys) {
				const promises = [];

				keys.forEach(async(key, y, z) => {
					const value = typeof values == `function` ? values(key, y, z) : values;
					promises.push(this.set(key, value));
				});

				return Promise.all(promises).then(resolve).catch(reject);
			}

			if(Array.isArray(prefixOrList)) {
				return doSetAll.call(this, prefixOrList);
			} else {
				return this.list(prefixOrList).then(r => doSetAll.call(this, r)).catch(reject);
			}
		});
	}

	/**
	 * Delete all keys (or keys that starts with a custom prefix, or specified keys in Array)
	 * @param {String|Array} prefixOrList Prefix or keys' names Array
	 * @async
	 * @returns {Promise<String[]|Error>}
	 */
	async deleteAll(prefixOrList=``) {
		return new Promise(async(resolve, reject) => {
			async function doDeleteAll(keys) {
				const promises = [];

				keys.forEach(async key => {
					promises.push(this.delete(key));
				});

				return Promise.all(promises).then(resolve).catch(reject);
			}

			if(Array.isArray(prefixOrList)) {
				return doDeleteAll.call(this, prefixOrList);
			} else {
				return this.list(prefixOrList).then(r => doDeleteAll.call(this, r)).catch(reject);
			}
		});
	}

	/**
	 * Remove all keys (or keys that starts with a custom prefix, or specified keys in Array, 'deleteAll' alias)
	 * @see #deleteAll
	 * @param {String|Array} prefixOrList Prefix or keys' names Array
	 * @async
	 * @returns {Promise<String[]|Error>}
	 */
	async removeAll(prefixOrList) {
		return this.deleteAll(prefixOrList);
	}
}

module.exports = ReplitDatabase;
