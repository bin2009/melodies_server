FROM node:22-alpine

WORKDIR /PBL6/node/app

COPY package*.json ./

RUN npm install

COPY . .

# RUN npm run build-src

# EXPOSE 8080

CMD [ "npm", "run", "dev" ]

# docker build --tag node-docker .
# docker run -p 8080:8080 -d node-docker
