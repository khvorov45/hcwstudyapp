FROM node:latest

WORKDIR /usr/src/hcwstudyapp-frontend
COPY . .

RUN npm install

RUN npm install -g serve

RUN npm run build

CMD serve -s build
