import * as admin from 'firebase-admin';

export const importProductList = async (companyID, supplier, products) => {

    const db = admin.firestore();
    

    var count = 1;
    var productCount = products.length;

    products.forEach(product => {
        
        console.log("product: " + count + "/" + productCount);
        count++;

        db.collection('user_companies').doc(companyID).collection("products").where('supplier', '==', supplier).where('remoteID', '==', product.remoteID).get().then((querySnapshot) => {
            if(querySnapshot.empty){
                importProduct(db, companyID, supplier, product);
            }else{
                ///UPDATE
                querySnapshot.forEach((doc) => {
                    if(doc.data().price_base != product.price_base || doc.data().price_retail != product.price_retail){
                        updateProduct(db, companyID, supplier, product, doc.id);
                    }
    
                    if(doc.data().available != product.available || doc.data().quantity != product.quantity){
                        updateProduct(db, companyID, supplier, product, doc.id);
                    }
                    
                });
            }
        })
            .catch((error) => {
                console.log("Error getting documents: ", error);
            });
    });

    
}

function updateProduct(db, companyID, supplier, product, dbID) {
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