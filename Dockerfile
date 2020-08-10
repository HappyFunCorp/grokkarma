FROM node:9

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./server/package*.json ./server/

# Install the dependencies
WORKDIR /usr/src/app/server
RUN npm install

# Copy smart contracts, install truffle
WORKDIR /usr/src/app
RUN mkdir ethereum
COPY ./ethereum ./ethereum/
RUN npm install -g truffle@5.0.11 --unsafe-perm

# Copy the API code over
WORKDIR /usr/src/app
COPY ./server ./server/

EXPOSE 3000
EXPOSE 3001
EXPOSE 8080

WORKDIR /usr/src/app
CMD sleep 5; cd ./ethereum; truffle migrate --network production; cd ../server; npm start
