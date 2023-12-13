import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { startImport } from './main/import/startImport';



const serviceAccount = require("C:/Projects/datapoint_angular_api/datapoint-angular-api/functions/pk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://datapoint-ca95e-default-rtdb.europe-west1.firebasedatabase.app",
  storageBucket: 'gs://datapoint-ca95e.appspot.com'
});
const app = express();
app.use(cors());

app.get('/hello', (request, response) => {
    //const db = admin.firestore();
    //startImport().then(() => response.send("HELLO BACK 3"));
    //db.collection("products").get().then((value) => {response.send(value.docs.at(0).data())}).catch(err => console.error(err));
 });


 //IMPORT
 app.get('/import', (request, response) => {
  const db = admin.firestore();

  db.collection("user_companies").get()
      .then((snapshot) => {

          // Iterate over each document in the collection
          snapshot.forEach(doc => {
              // Get the data from the document
              const companyDocument = doc.data();
              startImport(companyDocument, doc.id);
          });

          // Send the array of names as the response
          response.send("done");
      })
      .catch(err => {
          console.error(err);
          response.status(500).send('Error retrieving data');
      });
});




export const api = functions.https.onRequest(app);
