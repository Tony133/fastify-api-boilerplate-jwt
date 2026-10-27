FROM node:24-alpine
# NODE_ENV only ever takes the value "production": behaviour never depends on it
# (see https://www.platformatichq.com/node-principles), dependencies such as
# pino and nodemailer just skip their development-only extras.
ENV NODE_ENV=production
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]

