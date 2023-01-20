import * as admin from 'firebase-admin';
import { lostImport } from '../../partners/lost/manager';


export const startImport = async () =>{

    const db = admin.firestore();
    const companies = await db.collection("user_companies").get();
    const partners = await db.collection("partners").get();
    companies.forEach(company => {
        console.log(company.data().name);
        partners.forEach(async partner => {
            if(company.data().partners[partner.data().name] != null){
                switch(partner.data().name) { 
                    case "lost": { 
                       await lostImport(company.id);
                       break; 
                    } 
                    case "also": { 
                       //statements; 
                       break; 
                    } 
                    default: { 
                       //statements; 
                       break; 
                    } 
                 } 
            }
        })
    })
}