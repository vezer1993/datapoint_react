import fetch from 'node-fetch';
import { LostProductModel } from './model';
const { XMLParser } = require("fast-xml-parser");
import { importProductList } from '../../main/integration/db';
import { dbModel } from '../../main/integration/dbModel';


//const db = admin.firestore();

export const lostImport = async (companyID) => {
    const productList = await getLostProductList("https://shop.lost.hr/api/get_catalog.php?id=1863&user=2152&key=35f3e9bb43311a329da9951bdf094b9a");
    const dbProductList = prepareData(productList);
    await importProductList(companyID, "lost", dbProductList);
}

function prepareData(productList) {

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

async function getLostProductList(source) {
    try {
        // 👇️ const response: Response
        const response = await fetch(source, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }

        // 👇️ GET XML
        const result = await response.text();

        //PARSE XML
        const parser = new XMLParser();
        let jObj = parser.parse(result);

        //CONVERRT TO LIST OF OBJECTS
        const productList = <LostProductModel[]>jObj.entries.entry;

        return productList;

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