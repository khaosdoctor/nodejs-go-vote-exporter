FROM node:alpine

WORKDIR /usr/app
COPY . .

RUN npm install

EXPOSE 9837
CMD [ "npm", "start" ]
