import fetch from 'node-fetch';
import * as admin from 'firebase-admin';

export const jarltechImport = async (jarltechDocument, companyID) => {
    await getJarltechProductListAndSaveToStorage(jarltechDocument.source, "JARLTECH", companyID);
    //const dbProductList = prepareData(productList);
    //await importProductList(companyID, "lost", dbProductList);
}

async function getJarltechProductListAndSaveToStorage(source, partner, companyID) {
    try {
        const response = await fetch(source);

        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }
        // Fetch the CSV data
        const csvData = await response.text();

        // Define the file path in Firebase Storage
        const filePath = `${companyID}_${partner}.csv`;
        const fileRef = admin.storage().bucket().file(filePath);

        // Save the CSV data to Firebase Storage
        await fileRef.save(csvData, {
            metadata: {
                contentType: 'text/csv',
            },
        });

        console.log(`CSV file saved to Firebase Storage: ${filePath}`);
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