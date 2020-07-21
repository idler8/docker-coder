const http = require('http');
const dockerCreate = function (jsonbody) {
	return new Promise((resolve, reject) => {
		const options = {
			socketPath: '/var/run/docker.sock',
			path: '/containers/create',
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		};
		const clientRequest = http.request(options, function (res) {
			res.setEncoding('utf8');
			let result = '';
			res.on('data', (r) => (result += r));
			res.on('error', (e) => (result = e));
			res.on('end', (e) => {
				result = JSON.parse(result);
				if (res.statusCode == 201 && result.Id) return resolve(result.Id);
				console.log(result);
				reject();
			});
		});
		clientRequest.write(JSON.stringify(jsonbody));
		clientRequest.end();
	});
};
const dockerStart = function (id) {
	return new Promise((resolve, reject) => {
		const options = {
			socketPath: '/var/run/docker.sock',
			path: '/containers/' + id + '/start',
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		};
		const clientRequest = http.request(options, function (res) {
			console.log(`STATUS: ${res.statusCode}`);
			res.setEncoding('utf8');
			let result = '';
			res.on('data', (r) => (result += r));
			res.on('error', (e) => (result = e));
			res.on('end', (e) => {
				if (res.statusCode == 204) return resolve(id);
				result = JSON.parse(result);
				console.log(result);
				reject();
			});
		});
		clientRequest.end();
	});
};
exports.composer = function (Source, cmd = 'install') {
	return dockerCreate({
		Image: 'composer',
		HostConfig: {
			Binds: [Source + ':/app'],
			AutoRemove: true,
		},
		Tty: true,
		Cmd: [cmd],
	}).then((id) => dockerStart(id));
};
exports.npm = function (Source, cmd = 'build') {
	return dockerCreate({
		Image: 'node:14.5.0-alpine',
		WorkingDir: '/home/app',
		HostConfig: {
			Binds: [Source + ':/home/app'],
			AutoRemove: true,
		},
		Cmd: ['npm', 'run', cmd],
	}).then((id) => dockerStart(id));
};
const spawn = require('child_process').spawn;
exports.pull = function (path) {
	return new Promise(function (resolve, reject) {
		var child = spawn('git', ['-C', path, 'pull'], { encoding: 'utf-8' });
		var resp = '';
		child.stdout.on('data', function (buffer) {
			resp += buffer.toString();
		});
		child.on('error', (code) => {
			resp = '更新出错' + code;
		});
		child.on('close', (code) => {
			resolve(resp);
		});
	});
};
exports.clone = function (path, url) {
	return new Promise(function (resolve, reject) {
		var child = spawn('git', ['clone', url, path], { encoding: 'utf-8' });
		let infos = [];
		child.stderr.on('data', function (buffer) {
			let str = buffer.toString();
			str.split('\n').forEach((info) => {
				infos[0] = info;
				if (/done\.$/.test(info)) infos.unshift('');
			});
		});
		child.on('close', (code) => {
			infos.reverse();
			console.log(infos.join('\n'));
			resolve(code == 0 ? '拉取成功' : '拉取失败:' + code);
		});
	});
};
