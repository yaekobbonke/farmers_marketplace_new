npm install prisma@latest --save -dev
npm install @prisma/client@latest
npx prisma init 
npx prisma generate
npx prisma migrate dev --name init
npm install dotenv cors
npm install -D typescript ts-node @types/node @types/express
tsconfig.json file created

Implemented Authentication logic
    npm install bcrypt jsonwebtoken
    npm install -D @types/bcrypt @types/jsonwebtoken
npx tsc --init       //creates tsconfig.json file go

Product CRUD Endpoints
PHASE 4 — PRODUCTS MODULE
What this module will do

#Farmers create products (crop / livestock)
#Buyers view products
#Filter by category, location, price

This module will later power:
-price intelligence
-semantic search
-recommendations


Cart & Cart Items


Orders



Price History & AI Predictions




Frontend Integration
