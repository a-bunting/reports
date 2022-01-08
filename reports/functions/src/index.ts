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

exports.addMembership = functions.https.onCall((data: any, context: any) => {
    // check request is made by an admin
    if (context.auth.token.admin !== true) {
        return { error: 'Only admins can modify member status' }
    }

    // get the user and add a custom claim (admin = true)
    return admin.auth().getUserByEmail(data.email).then((user: any) => {
        return admin.auth().setCustomUserClaims(user.uid, {
            member: true
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has become a full member.`
        }
    }).catch((error: any) => {
        return error;
    });
});

exports.removeMembership = functions.https.onCall((data: any, context: any) => {
    // check request is made by an admin
    if (context.auth.token.admin !== true) {
        return { error: 'Only admins can modify member status' }
    }

    // get the user and add a custom claim (admin = true)
    return admin.auth().getUserByEmail(data.email).then((user: any) => {
        return admin.auth().setCustomUserClaims(user.uid, {
            member: false
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been removed as a paid member.`
        }
    }).catch((error: any) => {
        return error;
    });
});