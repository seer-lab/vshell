FROM node:12-onbuild
WORKDIR /opt/vshell
COPY package.json /opt/vshell
RUN npm install
COPY . /opt/vshell
CMD node bot.js
EXPOSE 8000