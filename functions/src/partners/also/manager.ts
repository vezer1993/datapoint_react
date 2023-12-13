import fetch from 'node-fetch';
import * as admin from 'firebase-admin';

export const alsoImport = async (alsoDocument, companyID) => {
    await getAlsoProductListAndSaveToStorage(alsoDocument.source, "ALSO", companyID);
    //const dbProductList = prepareData(productList);
    //await importProductList(companyID, "lost", dbProductList);
}

async function getAlsoProductListAndSaveToStorage(source, partner, companyID) {
    try {
        const response = await fetch(source);

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