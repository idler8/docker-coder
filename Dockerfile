FROM node:14.5.0-alpine
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN apk update && apk add git
COPY ./ /home/node/app
WORKDIR /home/node/app
RUN npm install
ENTRYPOINT node src/index.js
