//import * as admin from 'firebase-admin';
import { getDataServerSide } from "./crud/getData";
//import { dbModel } from './dbModel';

export const importProductList = async (companyID, supplier, products) => {

    //const db = admin.firestore();
    

    //var count = 1;
    //var productCount = products.length;

    console.log("IMPORT START " + supplier);

    getDataServerSide(companyID, supplier).then( (data) => {
        console.log("DONE");
    });
    //console.log(serverDB[0].name);

    await products.forEach(async (product) => {
        
        //console.log("product: " + count + "/" + productCount);
        //count++;
    });

    console.log("IMPORT FINISH " + supplier);
}

/*function updateProduct(db, companyID, supplier, product, dbID) {
    db.collection("user_companies").doc(companyID).collection("products").doc(dbID).update({
        quantity: product.quantity,
        available: product.available,
        price_base: product.price_base,
        price_retail: product.price_retail,
        rebate: product.rebate,
        warranty: product.warranty,
        synced: admin.firestore.FieldValue.serverTimestamp(),
    })
}

function importProduct(db, companyID, supplier, product) {
    db.collection("user_companies").doc(companyID).collection("products").add({
        name: product.name,
        quantity: product.quantity,
        available: product.available,
        category: product.category,
        parent_category: product.parent_category,
        ean: product.ean,
        price_base: product.price_base,
        price_retail: product.price_retail,
        rebate: product.rebate,
        description: product.description,
        brand: product.brand,
        margin: product.margin,
        pictures: product.pictures,
        documents: product.documents,
        warranty: product.warranty,
        remoteID: product.remoteID,
        supplier: supplier,
        synced: admin.firestore.FieldValue.serverTimestamp(),
    })
}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}*/