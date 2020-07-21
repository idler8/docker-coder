const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs-extra');
const multer = require('multer')({ dest: '../tmp/' });
const commands = require('./libs/commands.js');
const configs = require('./config.json');

app.use(express.static('../app'));
app.use(
	bodyParser.json({
		verify: function (req, res, buf) {
			req.rawBody = buf;
		},
	}),
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer.single('file'));
app.post('/webhook/:project', (req, res) => {
	let config = configs[req.params.project] || {};
	if (!config.cloneKey) return res.send('项目禁止控制');
	if (fs.existsSync('../app/' + req.params.project)) {
		if (!req.body.secret) return res.send('参数错误');
		let header_signature = req.get('X-Gitea-Signature');
		if (!header_signature) return res.send('缺少标识');
		let config = configs[req.params.project] || {};
		let key = config.pullKey || req.protocol + '://' + req.host + req.originalUrl;
		let payload_signature = crypto.createHmac('sha256', key).update(req.rawBody).digest('hex');
		if (header_signature != payload_signature) return res.send('密钥错误' + JSON.stringify({ key, header_signature, payload_signature }));
		commands.pull('../app/' + req.params.project).then((data) => {
			if (process.env.APPROOT && req.query.cmd) {
				if (req.query.cmd == 'npm') commands.npm(process.env.APPROOT + '/' + req.params.project);
				if (req.query.cmd == 'composer') commands.composer(process.env.APPROOT + '/' + req.params.project);
			}
			res.send(data);
		});
	} else {
		if (config.cloneKey != req.body.key) return res.send('克隆失败');
		if (!req.body.url) return res.send('链接不存在');
		commands.clone('../app/' + req.params.project, req.body.url).then((data) => {
			if (process.env.APPROOT && req.query.cmd) {
				if (req.query.cmd == 'npm') commands.npm(process.env.APPROOT + '/' + req.params.project);
				if (req.query.cmd == 'composer') commands.composer(process.env.APPROOT + '/' + req.params.project);
			}
			res.send(data);
		});
	}
});
app.post('/upload/:project', function (req, res) {
	let config = configs[req.params.project] || {};
	if (config.uploadKey != req.body.key) return res.send('项目禁止控制');
	if (!fs.existsSync('../app/' + req.params.project)) return res.send('项目不存在');
	if (!req.body.path) return res.end('参数错误');
	if (!req.file) return res.end('内容错误');
	fs.moveSync(req.file.path, '../app/' + req.params.project + '/' + req.body.path, { overwrite: true });
	res.end('上传成功');
});
if (process.env.DEBUG) {
	app.post('/stop', function () {
		console.log('发起停止请求');
		process.exit();
	});
}
app.listen(8888, function () {
	console.log('开始监听8888');
	process.env.APPROOT ? console.log('项目位置：' + process.env.APPROOT) : console.log('无项目打包配置');
});
