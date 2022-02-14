const path = require(`path`);
const fetch = require(path.join(__dirname, `fetch.js`));

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
			fetch.get({
				url: `${this.baseURL}/${encodeURIComponent(key)}`,
			}).then(resolve).catch(reject);
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
			}).catch(reject);
		});
	}

	/**
	 * Check if the database has a key ('has' alias)
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

			fetch({
				method: `POST`,
				url: `${this.baseURL}`,
				data: `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`,
			}).then(async() => resolve(key)).catch(reject);
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
			
			fetch.delete(`${this.baseURL}/${encodeURIComponent(key)}`).then(async() => resolve(key)).catch(reject);
		});
	}

	/**
	 * Remove a key ('delete' alias)
	 * @param {String} key Key's name
	 * @async
	 * @returns {Promise<String|Error>}
	 */
	async remove(key) {
		return this.delete(key);
	}

	/**
	 * Get a key's value
	 * @param {String} key Key's name
	 * @async
	 * @returns {Promise<String[]|Error>}
	 */
	async list(prefix=``) {
		return new Promise(async(resolve, reject) => {
			if(typeof prefix !== `string`) return reject(new Error(`Prefix must be a String, nor ${typeof prefix}.`));

			fetch.get({
				url: `${this.baseURL}`,
				data: `prefix=${encodeURIComponent(prefix)}`,
			}).then(resolve).catch(reject);
		});
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

			fetch.get({
				url: `${this.baseURL}`,
				data: `prefix=${encodeURIComponent(prefix)}`,
			}).then(resolve).catch(reject);
		});
	}

	/**
	 * List all keys (or keys that starts with a custom prefix, 'list' alias)
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
					promises.push(this.get(key));
				});

				return Promise.all(promises).then(resolve).catch(reject);
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
				return doSetAll(prefixOrList);
			} else {
				return this.list(prefixOrList).then(doSetAll).catch(reject);
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
				return doDeleteAll(prefixOrList);
			} else {
				return this.list(prefixOrList).then(doDeleteAll).catch(reject);
			}
		});
	}

	/**
	 * Remove all keys (or keys that starts with a custom prefix, or specified keys in Array, 'deleteAll' alias)
	 * @param {String|Array} prefixOrList Prefix or keys' names Array
	 * @async
	 * @returns {Promise<String[]|Error>}
	 */
	async removeAll(prefixOrList) {
		return this.deleteAll(prefixOrList);
	}
}

module.exports = ReplitDatabase;
