// Debug script to verify user data is being saved correctly
console.log("Debug user script loaded");

document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        // Listen for auth state changes
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log("User is signed in", user);
                console.log("Display Name:", user.displayName);
                console.log("Email:", user.email);
                console.log("UID:", user.uid);
                
                // Check Firestore data
                const db = firebase.firestore();
                db.collection('users').doc(user.uid).get()
                    .then(doc => {
                        if (doc.exists) {
                            console.log("Firestore user data:", doc.data());
                        } else {
                            console.log("No Firestore user document exists!");
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching user document:", error);
                    });
            } else {
                console.log("No user is signed in");
            }
        });
    }
});
