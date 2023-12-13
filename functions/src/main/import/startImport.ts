import { lostImport } from "../../partners/lost/manager";
import { alsoImport } from "../../partners/also/manager";
import { jarltechImport } from "../../partners/jarltech/manager";


export const startImport = async (data, companyID) => {
    // Check if 'partners' exists and is an object
    if (data.partners && typeof data.partners === 'object') {
        // Iterate through each key in the 'partners' map
        for (const [partnerKey, partnerValue] of Object.entries(data.partners)) {
            // Use a switch statement to handle different partner keys
            switch (partnerKey) {
                case 'lost':
                    // Handle the 'lost' case
                    console.log("Fetching LOST partner data:");
                    await lostImport(partnerValue, companyID);
                    break;

                case 'also':
                    // Handle the 'also' case
                    console.log("Fetching ALSO partner data:");
                    await alsoImport(partnerValue, companyID);
                    break;

                case 'jarltech':
                    // Handle the 'jarltech' case
                    console.log("FETCHING JARLTECH partner data:");
                    await jarltechImport(partnerValue, companyID);
                    break;

                default:
                    // Handle any other case
                    console.log(`Unknown partner key: ${partnerKey}`);
                    // Logic for any other or unknown partner keys
            }
        }
    }
};