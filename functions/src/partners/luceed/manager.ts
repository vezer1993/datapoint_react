import fetch from 'node-fetch';
import * as admin from 'firebase-admin';


//const partnerName = "lost";

export const luceedImport = async (luceedDocument, companyID) => {
    await fetchJsonAndSaveToStorage(luceedDocument, "LUCEED", companyID);
}

export const luceedFetchImages = async (companyID: string, barcode, partnerData: any): Promise<string[]> => {
    try {
        const username: string = partnerData.username;
        const password: string = partnerData.password;
        const base64Credentials: string = Buffer.from(`${username}:${password}`).toString('base64');
        const source: string = partnerData.source + '/barcode/';

        const response = await fetch(source + barcode, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }

        const jsonData = await response.json();
        let urls: string[] = [];

        for (const artikl of jsonData.result[0].artikli) {
            for (const dokument of artikl.dokumenti) {
                if (dokument.filename.endsWith('.png') || dokument.filename.endsWith('.jpg')) {
                    const fileResponse = await fetch(partnerData.source + '/dokumenti/' + dokument.file_uid, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Basic ${base64Credentials}`,
                            'Accept': 'application/json',
                        },
                    });

                    if (!fileResponse.ok) {
                        throw new Error(`Error! status: ${fileResponse.status}`);
                    }

                    const fileData = await fileResponse.json();
                    const fileContent: string = fileData.result[0].files[0].content;
                    const buffer: Buffer = Buffer.from(fileContent, 'base64');
                    const filename = dokument.file_uid + (dokument.filename.endsWith('.png') ? '.png' : '.jpg');
                    const folderName = `${companyID}_luceed`; // Construct the folder name
                    const filenameWithPath = `${folderName}/${filename}`; // Include the folder in the file path
                    const file = admin.storage().bucket().file(filenameWithPath);

                    await file.save(buffer, {
                        metadata: {
                            contentType: dokument.filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
                        },
                    });

                    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${file.bucket.name}/o/${folderName}%2F${filename}?alt=media`;
                    urls.push(fileUrl);
                }
            }
        }

        return urls;

    } catch (error) {
        console.error('Error: ', error);
        throw new Error('An error occurred while fetching images');
    }
};

//fetch json
async function fetchJsonAndSaveToStorage(luceedDocument, partner, companyID) {
    try {
        const username = luceedDocument.username;
        const password = luceedDocument.password;
        const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');

        const response = await fetch(luceedDocument.source + "/lista", {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }
        // Fetch the JSON data
        const jsonData = await response.json();

        // Define the file path in Firebase Storage
        const filePath = `${companyID}_${partner}.json`;
        const fileRef = admin.storage().bucket().file(filePath);

        // Save the JSON data to Firebase Storage
        await fileRef.save(JSON.stringify(jsonData), {
            metadata: {
                contentType: 'application/json',
            },
        });

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

/*
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

//FIND PRODUCT IN THE SOURCE
function findMatchingDataInXML(parsedXML, remoteID) {
    const productArray = parsedXML.entries.entry;
    return productArray.find(item => item.code === remoteID);
}*/