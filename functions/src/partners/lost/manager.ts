import fetch from 'node-fetch';
import * as admin from 'firebase-admin';
import { getFileFromStorage } from '../../main/integration/crud/db_crud';
import { getProductsForPartner } from '../../main/integration/crud/db_crud';
import { logToFirestore } from '../../main/integration/logs/logs';
import { XMLParser } from "fast-xml-parser";


const partnerName = "lost";

export const lostImport = async (lostDocument, companyID) => {
    await getLostProductListAndSaveToStorage(lostDocument.source, "LOST", companyID);
}

export const lostUpdate = async (lostDocument, companyID) => {
    const lostXML = await getFileFromStorage(companyID, "LOST.xml");
    if (lostXML != "") {
        try {
            const parser = new XMLParser();
            const parsedXML = parser.parse(lostXML);
            const querySnapshot = await getProductsForPartner(companyID, partnerName);

            for (const doc of querySnapshot.docs) {
                const product = doc.data();

                const matchingXMLData = findMatchingDataInXML(parsedXML, product.remoteID);

                if (matchingXMLData) {

                    var price_base = product.price_base;
                    var price_retail = product.price_retail;
                    var price_store = product.price_store;
                    var available = matchingXMLData.available;
                    var quantity = (available === "Dostupno") ? 1 : 0;
                    var synced = admin.firestore.Timestamp.now();

                    let updateData: any = { available, quantity, synced };

                    if (price_base != matchingXMLData.price || price_retail != matchingXMLData.vpc) {
                        price_base = matchingXMLData.price;
                        price_retail = matchingXMLData.vpc;
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

//Save file to storage
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

//FIND PRODUCT IN THE SOURCE
function findMatchingDataInXML(parsedXML, remoteID) {
    const productArray = parsedXML.entries.entry;
    return productArray.find(item => item.code === remoteID);
}