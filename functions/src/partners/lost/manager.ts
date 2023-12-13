import fetch from 'node-fetch';
import * as admin from 'firebase-admin';

export const lostImport = async (lostDocument, companyID) => {
    await getLostProductListAndSaveToStorage(lostDocument.source, "LOST", companyID);
    //const dbProductList = prepareData(productList);
    //await importProductList(companyID, "lost", dbProductList);
}

async function getLostProductListAndSaveToStorage(source, partner, companyID) {
    try {
        const response = await fetch(source, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }
        // Fetch the XML data
        const xmlData = await response.text();

        // Define the file path in Firebase Storage
        const filePath = `${companyID}_${partner}.xml`;
        const fileRef = admin.storage().bucket().file(filePath);

        // Save the XML data to Firebase Storage
        await fileRef.save(xmlData, {
            metadata: {
                contentType: 'text/xml',
            },
        });

        console.log(`File saved to Firebase Storage: ${filePath}`);
        return `File saved: ${filePath}`;

    } catch (error) {
        if (error instanceof Error) {
            console.log('error message: ', error.message);
            return error.message;
        } else {
            console.log('unexpected error: ', error);
            return 'An unexpected error occurred';
        }
    }
}

/*function prepareData(productList) {

    const dbProductList = [];
    
    productList.forEach(product => {

        var images = [];

        images.push(product.image);

        if(typeof product.images.item === 'string') {
            images.push(product.images.item);
        }else if(Object.prototype.toString.call(product.images.item) === '[object Array]'){
            product.images.item.forEach(element => {
                images.push(element);
            });
        }

        var available = false;

        if(product.available == "Dostupno"){
            product.available = "1";
            available = true;
            
        }else{
            product.available = "0";
        }

        const prod: dbModel = {
            name: product.product,
            quantity: +product.available,
            available: available,
            category: [product.category],
            parent_category: [product.category_parent],
            ean: "",
            remoteID: product.code,
            price_base: product.price,
            price_retail: product.vpc,
            rebate: product.rabat,
            description: product.specification,
            brand: product.brand,
            margin: 0,
            pictures: images,
            documents: [""],
            warranty: product.warranty,
            synced: ""
        }

        dbProductList.push(prod);
    });

    return dbProductList;
}
*/