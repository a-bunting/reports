import * as functions from "firebase-functions";

const admin = require('firebase-admin');
admin.initializeApp();

exports.addAdminRole = functions.https.onCall((data: any, context: any) => {
    // check request is made by an admin
    if (context.auth.token.admin !== true) {
        return { error: 'Only admins can add other admins' }
    }

    // get the user and add a custom claim (admin = true)
    return admin.auth().getUserByEmail(data.email).then((user: any) => {
        return admin.auth().setCustomUserClaims(user.uid, {
            admin: true
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been assigned an admin status.`
        }
    }).catch((error: any) => {
        return error;
    });
});