FROM node:latest

WORKDIR /usr/src/hcwstudyapp-frontend
COPY . .

RUN npm install

RUN npm install -g serve

CMD npm run build && serve -s build
