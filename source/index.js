const Fs = require('fs');
const Path = require('path');

exports.booting = 'root';
exports.install = function() {
	ROUTE('/', load);
	ROUTE('/api/css/', css, ['post']);
};

function css() {
	this.content(U.minifyStyle('/*auto*/\n' + (this.body.css || '')), 'text/plain');
}

function load() {
	var self = this;

	if (self.query.name) {
		var p = Path.join(process.cwd(), self.query.name);
		Fs.readFile(p + '/{0}.html'.format(self.query.type === '1' ? 'widget' : 'preview'), function(err, response) {
			if (err)
				self.content('');
			else
				self.content(response.toString('utf8'));
		});
		return self;
	}

	var cwd = process.cwd();
	var arr = [];
	var blacklist = /^\/(tmp|packages|node_modules|\.git)\//g;

	U.ls(cwd, function(files) {
		for (var i = 0; i < files.length; i++) {
			var filename = files[i];
			var file = Fs.readFileSync(filename).toString('utf8').parseJSON();
			var path = filename.replace(cwd, '');
			path = path.substring(1, path.indexOf('/', 1));
			arr.push({ name: file.name, value: path });
		}
		arr.quicksort('name');
		self.view('index', arr);
	}, function(path, isDirectory) {
		return isDirectory ? blacklist.test(path.replace(cwd, '')) === false : path.substring(path.length - 4) === 'json' && path.lastIndexOf('widgets.json') === -1;
	});
}