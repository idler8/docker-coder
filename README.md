# docker-coder

本项目使用NodeJS完成Docker Swarm服务器自动化管理。

## 配置
使用src/config.json进行配置，建议用swarm配置管理进行管理
## 端口
内部使用8888端口
## 路由
* POST /webhook/:project
项目存在时进行`git pull`拉取，按照Gitee规范验证
项目不存在时进行`git clone`克隆，简单验证`req.body.key == config.cloneKey`
* POST /upload/:project
上传文件到项目中，路径`req.body.path`，简单验证`req.body.key == config.uploadKey`
* POST 打开`process.env.DEBUG`时增加一个路由 /stop
用以快速重启本容器
* GET /*
静态查看所有项目文件
## 更新插件
当`req.query.cmd`存在时将对项目进行插件更新
支持`req.query.cmd == 'npm'`与`req.query.cmd == 'composer'`
分别控制`npm install`与`php composer install`
## 使用方法
```
git clone https://github.com/idler8/docker-coder
docker image build -t docker-coder ./docker-coder
docker run -p 8888:8888 -v /home:/home/node/app/app -v /var/run/docker.sock:/var/run/docker.sock -e APPROOT=/home -e DEBUG=true docker-coder
```
## License

MIT