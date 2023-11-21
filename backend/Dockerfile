FROM node:lts
RUN mkdir -p /home/node/app
WORKDIR /home/node/app
RUN npm i -g @nestjs/cli --silent
COPY package.json .
COPY package-lock.json .
RUN npm install --silent
COPY . .
# Value set in .env file.
EXPOSE $BACKEND_PORT
CMD ["npm", "run", "start:docker"]
