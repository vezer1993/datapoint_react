//import fetch from 'node-fetch';
import * as admin from 'firebase-admin';
import { XMLParser } from "fast-xml-parser";
const soap = require('strong-soap').soap;

//const partnerName = "microline";

export const microlineImport = async (microlineDocument, companyID) => {
    await getMicrolineProductListAndSaveToStorage(microlineDocument, "MICROLINE", companyID);
}

//Save file to storage
async function getMicrolineProductListAndSaveToStorage(microlineDocument, partner, companyID) {

    const url = microlineDocument.source;
    const username = microlineDocument.username;
    const password = microlineDocument.password;

    const productListXML = await getMicrolineXML(url, username, password);
    const productPriceListXML = await getMicrolinePriceListXML(url, username, password);

    const result = await combineXMLs(productListXML, productPriceListXML);

    const filePath = `${companyID}_${partner}.json`;
    const fileRef = admin.storage().bucket().file(filePath);


    // Save the XML data to Firebase Storage
    await fileRef.save(JSON.stringify(result, null, 2), {
        metadata: {
            contentType: 'application/json',
        },
    });

    console.log(`File saved to Firebase Storage: ${filePath}`);
    return `File saved: ${filePath}`;
}

async function getMicrolineXML(url, username, password) {
    return new Promise<string>((resolve, reject) => {
        // Options, if any, for the SOAP client
        const options = {};

        soap.createClient(url, options, function (err, client) {
            if (err) {
                console.error('Error in creating SOAP client:', err);
                return reject(err);
            }

            // Prepare the parameters for the itemList method
            const params = {
                customerKey: username,
                password: password,
                // Additional parameters if required
            };

            // Call the itemList method
            client.itemListAndData(params, function (err, result, rawResponse, soapHeader, rawRequest) {
                if (err) {
                    console.error('Error in calling itemList:', err);
                    return reject(err);
                }

                resolve(result.itemListAndDataResult);
            });
        });
    });
}

async function getMicrolinePriceListXML(url, username, password) {
    return new Promise<string>((resolve, reject) => {
        // Options, if any, for the SOAP client
        const options = {};

        soap.createClient(url, options, function (err, client) {
            if (err) {
                console.error('Error in creating SOAP client:', err);
                return reject(err);
            }

            // Prepare the parameters for the itemList method
            const params = {
                customerKey: username,
                password: password,
                // Additional parameters if required
            };

            //itemListAndData
            //priceList
            // Call the itemList method
            client.priceList(params, function (err, result, rawResponse, soapHeader, rawRequest) {
                if (err) {
                    console.error('Error in calling itemList:', err);
                    return reject(err);
                }

                //priceListResult
                //itemListAndDataResult
                resolve(result.priceListResult);
            });
        });
    });
}

function combineXMLs(xml1, xml2) {
    const parserOptions = {
        ignoreAttributes: false,
        attributeNamePrefix: "@"
    };
    const parser = new XMLParser(parserOptions);

    try {
        // Parse both XML strings
        const result1 = parser.parse(xml1);
        const result2 = parser.parse(xml2);

        // Function to safely get string value
        const getStringValue = (value) => {
            if (typeof value === 'string') {
                return value.trim();
            } else if (value && typeof value === 'object' && '_text' in value) {
                return value._text.trim();
            }
            return '';
        };

        // Extract items from the first XML
        const items1 = result1.items.item.map(i => {
            let warranty = '';
            if (i.warranty) {
                if (typeof i.warranty === 'object') {
                    // Extract the value and UoM from the warranty object
                    const warrantyValue = i.warranty._text || i.warranty._ || ''; // Adjust based on the actual structure
                    const warrantyUom = i.warranty['@uom'] || '';
                    warranty = `${warrantyValue} ${warrantyUom}`.trim();
                } else {
                    // If warranty is not an object, use it directly
                    warranty = i.warranty;
                }
            }

            return {
                artikl: {
                    key: getStringValue(i.key),
                    name: getStringValue(i.name),
                    pictureURLHighResolution: getStringValue(i.pictureURLHighResolution),
                    warranty: warranty,
                    manufacturersName: getStringValue(i.manufacturersName)
                }
            };
        });

        // Extract items from the second XML
        const items2 = result2.priceList.item.reduce((acc, i) => {
            const key = getStringValue(i['@key']);
            acc[key] = {
                tradeMark: getStringValue(i['@tradeMark']),
                quantityAvailable: getStringValue(i['@quantityAvailable']),
                availability: getStringValue(i['@availability']),
                sp: getStringValue(i['@sp']),
                group: getStringValue(i['@group']),
            };
            return acc;
        }, {});

        console.log(items2);

        // Combine items based on the key
        const combinedItems = items1.map(item => ({
            artikl: {
                ...item.artikl,
                ...(items2[item.artikl.key] || {})
            }
        }));

        return { artikli: combinedItems };
    } catch (err) {
        console.error('Error in parsing XML:', err);
        throw err;
    }
}

/*export const lostUpdate = async (lostDocument, companyID) => {
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

//FIND PRODUCT IN THE SOURCE
function findMatchingDataInXML(parsedXML, remoteID) {
    const productArray = parsedXML.entries.entry;
    return productArray.find(item => item.code === remoteID);
}*/