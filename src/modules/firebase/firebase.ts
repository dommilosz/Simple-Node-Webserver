import admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";

import {readFileFromStorageJSON} from "../../fileStorage";
import {getAndRegisterConfig} from "../../configHandler";

let serviceAccount = readFileFromStorageJSON("firebase_secret.json")

let defaultApp = initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://odrabiamyatosdb-default-rtdb.firebaseio.com"
});
// Retrieve services via the defaultApp variable...
export const firebase_db = getFirestore(defaultApp);

export async function firebase_set(collection:string,doc,data){
    await firebase_db.collection(collection).doc(String(doc)).set(data);
}

export async function firebase_get(collection:string,doc:string){
    return await firebase_db.collection(collection).doc(doc).get();
}
