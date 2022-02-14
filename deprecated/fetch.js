const https = require(`https`);

function resolveRequestOptions(arg) {
	const options = {};

	if(typeof arg == `string`) {
		Object.assign(options, {
			method: `GET`,
			url: arg,
		});
	} else if(typeof arg == `object`) {
		const methods = [`GET`, `POST`, `DELETE`];
		if(typeof arg.method == `string`) {
			if(!methods.includes(arg.method.toUpperCase())) throw new RangeError(`Request method must be ${methods.map(x => `"${x}"`).join(`, `)}. Nor "${arg.method}".`);
			options.method = arg.method.toUpperCase();
		} else {
			options.method = `GET`;
		}

		options.headers = typeof arg.headers == `object` ? arg.headers : {};
		// options.data = arg.data !== undefined ? JSON.stringify(arg.data) : undefined;
		options.data = arg.data !== undefined ? arg.data : ``;
		options.url = arg.url;
	} else {
		throw new TypeError(`resolveRequestOptions argument must be a String or Object, nor ${typeof arg}.`);
	}

	if(!options.url) throw new Error(`You must set a valid URL.`);
	if(typeof options.url !== `string`) throw new TypeError(`You must set a String for URL.`);

	Object.assign(options, {
		decoder: typeof arg.decoder == `function` ? arg.decoder : JSON.parse,
		data: options.data || ``,
	});

	return options;
}

/**
 * Fetch a website
 * @param {RequestOptionsResolvable} options Request options
 * @returns {Promise<Response|Error>}
 */
async function fetch(options) {
	return new Promise(async(resolve, reject) => {
		const opts = resolveRequestOptions(options);

		// Request
		const req = https.request(opts.url, {
			port: 443,
			method: opts.method || `GET`,
			headers: {
				// "Content-Type": `application/json`,
				...opts.headers,
				"Content-Type": "text/plain",
				"Content-Length": opts.data.length,
			},
		}, async res => {
			const data = new Array();

			res.on(`data`, async d => data.push(d));

			res.on(`end`, async() => {
				try {
					console.log(Buffer.concat(data).toString(`utf-8`));
					if(data.length <= 0) return resolve(undefined);
					if(Buffer.concat(data).toString(`utf-8`).length <= 0) return resolve(null);
					return resolve((opts || JSON.parse).decoder(Buffer.concat(data)));
				} catch(err) {
					return reject(err);
				}
			});
		});

		req.on(`error`, reject);

		req.write(opts.data);

		req.end();
	});
}

async function get(options) {
	return fetch({
		...options,
		method: `GET`,
	});
}

async function _delete(options) {
	return fetch({
		...options,
		method: `DELETE`,
	});
}

Object.assign(fetch, {
	get,
	delete: _delete,
});

module.exports = fetch;
