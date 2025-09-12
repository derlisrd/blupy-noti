

import express from "express";
import routeApi from "./src/routes/api.js";
import logger from './src/middleware/logger.js';
import config from './src/app/config.js';
import cors from 'cors'
import firebase from 'firebase-admin'


firebase.initializeApp({
  credential: firebase.credential.cert("./fcm.json")
});




const app = express();


app.use(cors())
app.use(express.json());
app.use(logger);
app.use('/api',  routeApi);


const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server running http://localhost:${PORT}`);
});


