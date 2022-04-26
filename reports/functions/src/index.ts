import * as functions from "firebase-functions";

const admin = require('firebase-admin');
admin.initializeApp();

exports.addAdminRole = functions.https.onCall((data: any, context: any) => {
    // check request is made by an admin
    if (context.auth.token.admin !== true) {
        return { error: 'Only admins can modify other admins' }
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

exports.removeAdminRole = functions.https.onCall((data: any, context: any) => {
    // check request is made by an admin
    if (context.auth.token.admin !== true) {
        return { error: 'Only admins can modify other admins' }
    }

    // get the user and add a custom claim (admin = true)
    return admin.auth().getUserByEmail(data.email).then((user: any) => {
        return admin.auth().setCustomUserClaims(user.uid, {
            admin: false
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been removed as an admin.`
        }
    }).catch((error: any) => {
        return error;
    });
});

exports.addManagerRole = functions.https.onCall((data: any, context: any) => {
    // check request is made by an admin
    if (context.auth.token.admin !== true) {
        return { error: 'Only admins can modify other admins' }
    }

    // get the user and add a custom claim (admin = true)
    return admin.auth().getUserByEmail(data.email).then((user: any) => {
        return admin.auth().setCustomUserClaims(user.uid, {
            manager: true
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been assigned a manager status.`
        }
    }).catch((error: any) => {
        return error;
    });
});

exports.removeManagerRole = functions.https.onCall((data: any, context: any) => {
    // check request is made by an admin
    if (context.auth.token.admin !== true) {
        return { error: 'Only admins can modify other admins' }
    }

    // get the user and add a custom claim (admin = true)
    return admin.auth().getUserByEmail(data.email).then((user: any) => {
        return admin.auth().setCustomUserClaims(user.uid, {
            manager: false
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been removed as a Manager.`
        }
    }).catch((error: any) => {
        return error;
    });
});

exports.confirmOrderAndAddMembership = functions.https.onCall((data: any, context: any) => {
  const headers: Headers = new Headers();
  headers.append('Authorization', 'Basic <AU156owG9pH3HWD6OQbRgk_KhVs0Ne5Mh3kknwJYYjcIFeZ8sswDvhgA_WqDgAxDYDW8bbcp_IWQVCZ8:EL2PnzL0Oe1gvPKwgmsMz2t0J8T1672TlLIo2JYMNUBVsfq4m3Qgc-0deoATB6FGGVOhKpCIW_vowGRi>');
  headers.append('Content-Type', 'application/json');

  fetch(`https://api.sandbox.paypal.com/v2/checkout/orders/06V622347U0470228`, { method: 'GET', headers: headers })
  // fetch(`https://api.sandbox.paypal.com/v2/checkout/orders/${data.paymentId}`, { method: 'GET', headers: headers})
  .then((response) => {
    // check if the payment is actual and the same as the user details, and if so then this is a proper
    // transaction and the user can be credited with time on their account.
    return response;
  })
  .catch((error) => {
    return `Nope:` + error.message;
  });
});
