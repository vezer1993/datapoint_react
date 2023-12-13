import * as admin from 'firebase-admin';


export const getDataServerSide = async (companyID, supplier) => {

    const db = admin.firestore();
    const fs = require('fs');
    var path = "./data/" + companyID + "_" + supplier + "_data.json";

    if (fs.existsSync(path)) {
        console.log("reading data");
        const loadedData = fs.readFileSync(path, 'utf-8');
        const data = JSON.parse(loadedData);
        return data;
    } else {
        db.collection('user_companies').doc(companyID).collection("products")
        .where('supplier', '==', supplier).get()
        .then(async (querySnapshot) => {
            if (!querySnapshot.empty) {
                return writeDataServerSide(companyID, supplier, querySnapshot.docs)
                        .then((data) => {
                            return querySnapshot;
                        });
            } else {
                return [];
            }
        });
    }
}

export const writeDataServerSide = async (companyID, supplier, products) => {

    const fs = require('fs');
    var path = "./data/" + companyID + "_" + supplier + "_data.json";

    fs.writeFile(path, JSON.stringify(products, null, 2), (error) => {
        if (error) {
            console.log('An error has occurred ', error);
            return;
        }
        console.log('Data written successfully to disk');
    });

}
