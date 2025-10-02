FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* /app/
RUN npm install
COPY . /app
EXPOSE 3000
CMD ["npm", "run", "dev"]