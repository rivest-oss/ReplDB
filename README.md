## About
`replitdb` is a simple to use and enhanced client for Replit databases.

## Installation
**How to install it?**

```sh-session
npm install replitdb
```

## Examples of use:

Initialise the database:
```js
const ReplDB = require(`replitdb`),
	repldb = new ReplDB();
```

Get a document:
```js
repldb.get('document name').then(res => {
	console.log(`Value:`, res);
}).catch(err => {
	// Catch error
});
```

Set a document:
```js
repldb.set('document name', 'document value').then(() => {
	console.log('Document added!');
}).catch(err => {
	// Catch error
});
```

Delete a document:
```js
repldb.delete('document name').then(() => {
	console.log('Document deleted!');
}).catch(err => {
	// Catch error
});
```

List all documents names with certain prefix:
```js
repldb.list('user_').then(keys => {
	console.log('Documents:', keys);
}).catch(err => {
	// Catch error
});
```

Get all documents with certain prefix:
```js
repldb.getAll('user_').then(users => {
	console.log('Users:', users);
}).catch(err => {
	// Catch error
});
```

Add an element to an array of a certain document:
```js
repldb.update('user_86068052', {
	$add: {
		badges: 64,
	},
}).then(() => {
	console.log('Updated array!');
}).catch(err => {
	// Catch error
});
```


## Support

If you don't understand something, are experiencing problems or just need to be guided, feel free to join [our Discord server](https://discord.com/invite/p6v6VSDSpW).
