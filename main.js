var snoowrap = require('snoowrap'),
	fs = require('fs'),
	path = require('path'),
	request = require('request'),
	sanitize = require("sanitize-filename");
	
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

function filterBySubReddit(results, subReddits) {
	return results.filter(r => { 
		return subReddits.indexOf(r.subreddit.display_name) > -1 
	});
};

function download(uri, filename, callback){

	let found = false;
	fs.readdirSync(config.other.folderName).forEach(file => {
		if(file === filename) {
			console.log("file " + filename + " already downloaded");
			found = true;
			return false;
		}
	});

	if(!found) {	// let's download it
		request.head(uri, function(err, res, body){
			if(!err) {
				console.log('content-type:', res.headers['content-type']);
				console.log('content-length:', res.headers['content-length']);
				
				request(uri).pipe(fs.createWriteStream(config.other.folderName + filename)).on('close', callback);
			
				console.log('downloaded ' + filename);
			}
			else {
				console.error("There was an error during the download", err);
				callback();
			}
		});
	} else {	// go to next element
		callback();
	}
};

// init reddit client with snoowrap
const redditClient = new snoowrap({
    userAgent: config.reddit.userAgent,
    clientId: config.reddit.clientId,
    clientSecret: config.reddit.clientSecret,
    username: config.reddit.username,
    password: config.reddit.password
});

redditClient.getMe().getUpvotedContent().fetchAll().then( results => {

	results = filterBySubReddit(results, config.reddit.subReddits).reverse();

	let counter = 0;
	let maxCounter = results.length;

	function nextOrQuit() {
		++counter;
		if(counter >= maxCounter)
			process.exit();

		downloadImageFromPost();
	}

	const availableExtensions = ['jpg','jpeg','png','gif','bmp'];
	function canBeImage(str) {
		let fileExt = str.split('.').pop();
		fileExt = fileExt.split('?')[0];

		if(fileExt && (availableExtensions.indexOf(fileExt) > -1))
			return fileExt;
		else 
			return false;
	}

	function downloadImageFromPost() {
		let post = results[counter];
		let fileExt = canBeImage(post.url);
		if(fileExt) {
			let sanitizedTitle = sanitize(post.title);
			download(post.url, sanitizedTitle + '.' + fileExt, () => {
				nextOrQuit();
			});
		}
		else {
			nextOrQuit();
		}
	};

	downloadImageFromPost();
});

