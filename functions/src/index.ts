import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { startImport } from './main/import/startImport';
import { startUpdate } from "./main/update/startUpdate";
import { luceedFetchImages } from "./partners/luceed/manager";
import { wandFetchImages } from "./partners/wand/manager";

const serviceAccount = require("./pk.json");
//extend request with companyID
declare module 'express-serve-static-core' {
    interface Request {
        companyID?: string;
    }
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://datapoint-ca95e-default-rtdb.europe-west1.firebasedatabase.app",
    storageBucket: 'gs://datapoint-ca95e.appspot.com'
});
const app = express();
app.use(cors());

//user authentication middleware function
const authenticateUser = async (request, response, next) => {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        return response.status(401).send('Authorization header is required');
    }

    const userUID = authHeader.split(' ')[1]; // Assuming format "Bearer userUID"

    try {
        const userRef = admin.firestore().collection('users').doc(userUID);
        const doc = await userRef.get();

        if (!doc.exists) {
            return response.status(404).send('User not found');
        }

        // Attach user information to the request object
        request.companyID = doc.data().company; // or just `request.user = userUID;` if that's all you need

        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        console.error(error);
        response.status(500).send('Server error during authentication');
    }
};

//admin authentication for internal function call
const authenticateAdmin = async (request, response, next) => {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        return response.status(401).send('Authorization header is required');
    }

    const token = authHeader.split(' ')[1]; // Assuming format "Bearer token"

    try {

        if (token != "SfWxfEHDfxnno4DDrpYZ") {
            return response.status(404).send('Token is not correct');
        }

        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        console.error(error);
        response.status(500).send('Server error during authentication');
    }
};

//simple,test
app.get('/hello', (request, response) => {
    //const db = admin.firestore();
    //startImport().then(() => response.send("HELLO BACK 3"));
    //db.collection("products").get().then((value) => {response.send(value.docs.at(0).data())}).catch(err => console.error(err));
});


//IMPORT
app.get('/import', authenticateAdmin, async (request, response) => {
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

//UPDATE
app.get('/update', authenticateAdmin, (request, response) => {
    const db = admin.firestore();

    db.collection("user_companies").get()
        .then((snapshot) => {

            // Iterate over each document in the collection
            snapshot.forEach(doc => {
                // Get the data from the document
                const companyDocument = doc.data();
                startUpdate(companyDocument, doc.id);
            });

            // Send the array of names as the response
            response.send("Finished Update");
        })
        .catch(err => {
            console.error(err);
            response.status(500).send('Error retrieving data');
        });
});

//FETCH PRODUCTS
app.get('/products', authenticateUser, async (request, response) => {
    const companyID = request.companyID;

    if (!companyID) {
        return response.status(400).send('Company ID is required');
    }

    try {
        const selectedProductsRef = admin.firestore().collection(`user_companies/${companyID}/selected_products`);
        const snapshot = await selectedProductsRef.get();

        let selectedProducts = [];
        snapshot.forEach(doc => {
            selectedProducts.push({ id: doc.id, ...doc.data() });
        });

        return response.json({ status: 'success', selectedProducts: selectedProducts });
    } catch (error) {
        console.error(error);
        return response.status(500).send('Error retrieving selected products');
    }
});

//FETCH CATEGORIES
app.get('/categories', authenticateUser, async (request, response) => {
    const companyID = request.companyID;

    if (!companyID) {
        return response.status(400).send('Company ID is required');
    }

    try {
        const categoriesRef = admin.firestore().collection(`user_companies/${companyID}/categories`);
        const snapshot = await categoriesRef.get();

        let categoriesArray = [];
        for (const doc of snapshot.docs) {
            let subCategoriesArray = [];

            const subCategoryRef = admin.firestore().collection(`user_companies/${companyID}/categories/${doc.id}/sub_categories`);
            const subSnapshot = await subCategoryRef.get();

            // Process sub-categories here
            for (const subDoc of subSnapshot.docs) {
                subCategoriesArray.push({ id: subDoc.id, ...subDoc.data() });
            }

            categoriesArray.push({ id: doc.id, subCategories: subCategoriesArray, ...doc.data() });
        }

        return response.json({ status: 'success', categories: categoriesArray });
    } catch (error) {
        console.error(error);
        return response.status(500).send('Error retrieving selected products');
    }
});

//LUCEED PICTURES
app.get('/luceed', authenticateUser, async (request, response) => {
    const companyID = request.companyID;
    const barcode = request.query.barcode; // Access the barcode from query parameters

    if (!companyID) {
        return response.status(400).send('Company ID is required');
    }
    if (!barcode) {
        return response.status(400).send('Barcode is required');
    }

    const db = admin.firestore();
    try {
        const docRef = db.collection("user_companies").doc(companyID);
        const snapshot = await docRef.get();

        if (!snapshot.exists) {
            return response.status(404).send('Company not found');
        }

        const companyData = snapshot.data();

        // Use companyData for your logic
        const urls = await luceedFetchImages(companyID, barcode, companyData.partners.luceed);

        // Further processing and response
        return response.json({ urls });
    } catch (err) {
        console.error(err);
        return response.status(500).send('Error retrieving data');
    }
});

//LUCEED PICTURES
app.get('/wand', authenticateUser, async (request, response) => {
    const companyID = request.companyID;
    const picture = request.query.picture; // Access the barcode from query parameters

    if (!companyID) {
        return response.status(400).send('Company ID is required');
    }
    if (!picture) {
        return response.status(400).send('Picture is required');
    }

    const db = admin.firestore();
    try {
        const docRef = db.collection("user_companies").doc(companyID);
        const snapshot = await docRef.get();

        if (!snapshot.exists) {
            return response.status(404).send('Company not found');
        }

        const companyData = snapshot.data();

        // Use companyData for your logic
        const url = await wandFetchImages(companyID, picture, companyData.partners.wand);

        // Further processing and response
        return response.json({ url });
    } catch (err) {
        console.error(err);
        return response.status(500).send('Error retrieving data');
    }
});


export const api = functions.region('europe-west1').https.onRequest(app);
