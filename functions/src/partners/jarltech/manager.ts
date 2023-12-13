import fetch from 'node-fetch';
import * as admin from 'firebase-admin';
import { getFileFromStorage } from '../../main/integration/crud/db_crud';
import { getProductsForPartner } from '../../main/integration/crud/db_crud';
import { logToFirestore } from '../../main/integration/logs/logs';
import * as Papa from 'papaparse';

const partnerName = "jarltech";

export const jarltechImport = async (jarltechDocument, companyID) => {
    await getJarltechProductListAndSaveToStorage(jarltechDocument.source, "JARLTECH", companyID);
}

export const jarltechUpdate = async (jarltechDocument, companyID) => {
    const jarltechCSV = await getFileFromStorage(companyID, "JARLTECH.csv");
    if (jarltechCSV != "") {
        try {
            const parsedData = await parseCSV(jarltechCSV);
            const querySnapshot = await getProductsForPartner(companyID, partnerName);

            for (const doc of querySnapshot.docs) {
                const product = doc.data();
                const matchingCSVData = findMatchingDataInCSV(parsedData, product.remoteID);

                if (matchingCSVData) {

                    var price_base = product.price_base;
                    var price_retail = product.price_retail;
                    var price_store = product.price_store;
                    var available = "Nedostupno";

                    if (matchingCSVData.STOCK_QTY > 0) {
                        available = "Dostupno";
                    }

                    var quantity = +matchingCSVData.STOCK_QTY;
                    var synced = admin.firestore.Timestamp.now();

                    let updateData: any = { available, quantity, synced };

                    const priceString = matchingCSVData.YOUR_PRICE_NET_PER_PACKING_UNIT;
                    const priceNumber = parseFloat(priceString.replace(',', '.'));

                    if (price_base != priceNumber || price_retail != priceNumber) {
                        console.log("inside the price change");
                        price_base = priceNumber;
                        price_retail = priceNumber;
                        price_store = +(price_retail + ((price_retail * product.margin) / 100)).toFixed(2)

                        updateData.price_base = price_base;
                        updateData.price_retail = price_retail;
                        updateData.price_store = price_store;
                    }


                    await doc.ref.update(updateData);
                    console.log(`Document with remoteID ${product.remoteID} updated.`);


                } else {
                    logToFirestore(companyID, "update", {
                        success: false,
                        message: 'Could not find the product with remoteID: ' + product.remoteID + ' in the ' + partnerName + ' source',
                        partner: partnerName
                    });
                }
            }

        } catch (error) {
            await logToFirestore(companyID, "update", {
                success: false,
                message: error.message,
                partner: partnerName
            });
        }
    } else {
        await logToFirestore(companyID, "update", {
            success: false,
            message: "Error fetching file from storage",
            partner: partnerName
        });
    }
}

function parseCSV(csvText) {
    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            complete: results => resolve(results.data),
            error: error => reject(error),
        });
    });
}

//FIND PRODUCT IN THE SOURCE
function findMatchingDataInCSV(parsedCSV, remoteID) {
    return parsedCSV.find(item => item.ARTNUM === remoteID);
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