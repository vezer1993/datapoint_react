import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import { getFileFromStorage, getProductsForPartner } from '../../main/integration/crud/db_crud';
import { logToFirestore } from '../../main/integration/logs/logs';
const ftp = require('ftp');
const wandHeaders = [
    "RobaID",
    "Vrsta",
    "Tip",
    "Ident",
    "Sifra",
    "GrupaID",
    "HomePage",
    "KatBroj",
    "Naziv",
    "Naziv1",
    "Naziv2",
    "JM",
    "OblPoPak",
    "TezinaPak",
    "JMTezine",
    "Oblik",
    "FaktorOblika",
    "Doza",
    "Volumen",
    "ProizvodjacID",
    "Proizvodjac",
    "A1",
    "A2",
    "A3",
    "A4",
    "Ambalaza",
    "GrupaStavki",
    "Tarifa",
    "ZemljaPodrijetla",
    "AtestBroj",
    "AtestDatum",
    "Jamstvo",
    "BarKod",
    "Kolicina",
    "Zaliha",
    "Rezervirano",
    "Raspolozivo",
    "PDV",
    "Trosarina",
    "VPCijena",
    "MPCijena",
    "OriginalnaVPCijena",
    "OriginalnaMPCijena",
    "WWW",
    "DatumUnosa",
    "Slika",
    "Slika2",
    "Slika3",
    "Slika4",
    "Slika5",
    "Slika6",
    "BrojSlika",
    "Cjenik1",
    "Cjenik2",
    "Cjenik3",
    "Cjenik4",
    "Cjenik5",
    "Cjenik6",
    "Cjenik7",
    "Cjenik8",
    "SkladisnoMjesto",
    "KolicinaMin",
    "KolicinaOpt",
    "KolicinaMax",
    "Opis"
];
const partnerName = "wand";

interface Product {
    [key: string]: string;
}

export const wandImport = async (wandDocument, companyID) => {
    await fetchWandCatalog(wandDocument, "WAND", companyID);
}

export const wandUpdate = async (wandDocument, companyID) => {
    const wandJSON = await getFileFromStorage(companyID, "WAND.json");
    if (wandJSON != "") {
        try {
            const querySnapshot = await getProductsForPartner(companyID, partnerName);

            for (const doc of querySnapshot.docs) {
                const product = doc.data();
                
                const matchingData = findMatchingDataInJSON(wandJSON, product.remoteID);
                if (matchingData) {

                    var available = product.available;

                    if (matchingData.raspolozivo == "D") {
                        available = "Dostupno";

                    } else {
                        available = "Nedostupno";
                    }

                    var price_base = product.price_base;
                    var price_retail = product.price_retail;
                    var price_store = product.price_store;

                    var quantity = +matchingData.Raspolozivo;
                    var synced = admin.firestore.Timestamp.now();

                    let updateData: any = { available, quantity, synced };

                    if (price_base != matchingData.VPCijena || price_retail != matchingData.MPCijena) {
                        price_base = matchingData.VPCijena;
                        price_retail = matchingData.MPCijena;
                        price_store = +price_retail;
                        if(product.margin != 0){
                            price_store = +(price_retail + ((price_retail * product.margin) / 100)).toFixed(2);
                        }

                        updateData.price_base = price_base;
                        updateData.price_retail = price_retail;
                        updateData.price_store = price_store;
                    }

                    updateData.description = matchingData.Opis;
                    

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

function findMatchingDataInJSON(json, remoteID) {
    const productArray = JSON.parse(json);
    return productArray.find(item => item.RobaID === remoteID);
}

async function fetchWandCatalog(wandDocument, partner, companyID) {
    try {
        const stream = await fetchFileFromFTP(
            wandDocument.source,
            wandDocument.username,
            wandDocument.password,
            wandDocument.katalog_path
        );

        const text = await streamToUtf8String(stream, "CP1252");
        const dataBlocks = extractDataBlocks(text);
        const allProducts = splitProductBlocks(dataBlocks);
        const jsonArray = createJsonArray(allProducts, wandHeaders);

        const jsonFilePath = `${companyID}_${partner}.json`;
        await uploadJsonToFirebase(JSON.stringify(jsonArray), jsonFilePath);

        console.log('File uploaded successfully');
    } catch (error) {
        console.error('Error:', error);
    }
}

async function uploadJsonToFirebase(jsonString: string, destinationPath: string) {
    const bucket = admin.storage().bucket();
    const file = bucket.file(destinationPath);
    const writeStream = file.createWriteStream({
        metadata: {
            contentType: 'application/json',
        },
    });

    return new Promise((resolve, reject) => {
        writeStream.on('error', (error) => reject(error));
        writeStream.on('finish', () => resolve(null));
        writeStream.end(jsonString);
    });
}


async function fetchFileFromFTP(host, username, password, ftpPath) {
    return new Promise<fs.ReadStream>((resolve, reject) => {
        const client = new ftp();

        client.on('ready', () => {
            client.get(ftpPath, (err, stream) => {
                if (err) {
                    client.end();
                    reject(err);
                    return;
                }

                stream.once('close', () => client.end());
                stream.once('error', (error) => reject(error));

                resolve(stream);
            });
        });

        client.on('error', (err) => reject(err));

        client.connect({ host, user: username, password });
    });
}

async function streamToUtf8String(stream, originalEncoding): Promise<string> {
    const chunks = [];
    return new Promise<string>((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            // Convert the buffer from original encoding to UTF-8
            const utf8String = iconv.decode(buffer, originalEncoding);
            let resultString = utf8String
                .replace(/è/g, 'č')
                .replace(/È/g, 'Č')
                .replace(/æ/g, 'ć')
                .replace(/Æ/g, 'Ć')
                .replace(/ð/g, 'đ')
                .replace(/Ð/g, 'Đ');
            resolve(resultString);
        });
    });
}

function extractDataBlocks(text: string): string[] {
    const pattern = /INSERT \[dbo\]\.\[Robas\] VALUES(.*?)\/\* Eksportirano:/gs;
    let match: RegExpExecArray | null;
    const blocks: string[] = [];

    while ((match = pattern.exec(text)) !== null) {
        // Add the captured group (without 'INSERT [dbo].[Robas] VALUES' and '/* Eksportirano:')
        blocks.push(match[1].trim());
    }

    console.log(blocks[0]);

    return blocks;
}

function splitProductBlocks(productBlocks: string[]): string[] {
    let allProducts: string[] = [];
    for (let i = 0; i < productBlocks.length; i++) {
        const block: string = productBlocks[i];
        const productArray: string[] = block.split("\r\n,");
        allProducts = allProducts.concat(productArray);
    }
    return allProducts;
}

function createJsonArray(products: string[], headers: string[]): Product[] {
    return products.map((product): Product => {
        // Remove the first "(" and the last ")", then split the string
        const productData: string[] = product.slice(1, -1)
            .match(/('(?:''|[^'])*'|[^,])+/g) || [];

        // Create an object for the product
        const productObject: Product = {};

        headers.forEach((header, index) => {
            let value: string = (productData[index] || '').trim();

            // Remove surrounding single quotes and replace '' with '
            if (value.startsWith("N'")) {
                value = value.substring(2, value.length - 1);
            }
            value = value.replace(/''/g, '\'');

            productObject[header] = value;
        });

        return productObject;
    });
}

//pictures
export const wandFetchImages = async (companyID: string, picture, partnerData: any): Promise<string> => {
    try {
        const username: string = partnerData.username;
        const password: string = partnerData.password;
        const host: string = partnerData.source;
        const path: string = 'Content/slike/' + picture;

        const stream = await fetchFileFromFTP(host, username, password, path);
        const buffer = await streamToBuffer(stream);

        const url = await uploadFileToFirebase(buffer, picture, companyID);

        return url;

    } catch (error) {
        console.error('Error: ', error);
        throw new Error('An error occurred while fetching images: ' + error.message);
    }
};

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

async function uploadFileToFirebase(buffer, picture, companyID) {
    const filename = picture;
    const folderName = `${companyID}_wand_pictures`;
    const filenameWithPath = `${folderName}/${filename}`;
    const file = admin.storage().bucket().file(filenameWithPath);

    await file.save(buffer, {
        metadata: {
            contentType: picture.endsWith('.png') ? 'image/png' : 'image/jpg',
        },
    });

    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${file.bucket.name}/o/${encodeURIComponent(folderName)}%2F${encodeURIComponent(filename)}?alt=media`;
    return fileUrl;
}