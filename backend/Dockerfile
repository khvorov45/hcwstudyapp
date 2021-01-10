FROM node:latest

WORKDIR /usr/src/hcwstudyapp-backend
COPY . .

RUN npm install

RUN npm run build

ENTRYPOINT ["node", "build/server.js"]
