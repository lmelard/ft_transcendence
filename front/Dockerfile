FROM node:20
WORKDIR /usr/src/app
COPY package.json .
COPY package-lock.json .
RUN npm install --silent
COPY . .
RUN npm i serve && npm run build
RUN chmod 755 ./src/utils_docker/init.sh
EXPOSE $FRONTEND_PORT
CMD ["./src/utils_docker/init.sh"]