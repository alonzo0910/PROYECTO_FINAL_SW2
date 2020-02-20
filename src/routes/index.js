const { Router } = require('express');
const router = Router();
//const firebase = require('firebase-admin');
//-----------------------------------------------
const admin = require('firebase-admin');

const firebase = require("firebase");

var firebaseConfig = require("../../firebaseConfig");

var serviceAccount = require("../../firestore-sw2-firebase-adminsdk-vidyq-f6edb114a6");


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://firestore-sw2.firebaseio.com'
});

firebase.initializeApp(firebaseConfig);
firebase.auth().onAuthStateChanged((user) => {
    if (user == null) {
        console.log(user)
    } else {
        console.log(user.uid)
    }
})

const db = admin.firestore();

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/signIn', (req, res) => {
    res.render('signIn');;
});

router.post('/validated', (req, res) => {
    var username = req.body.username;
    const password = req.body.password;

    db.collection('users').where('username', '==', username).get()
        .then((snapshot) => {
            if (snapshot.empty) {
                res.render('signIn', { error: "Usuario o contraseña inválido" })
            } else {
                snapshot.docs.forEach(doc => {
                    const email = doc.data().email;
                    firebase.auth().signInWithEmailAndPassword(email, password)
                        .then(() => {
                            res.redirect('/principal');
                        })
                        .catch(err => {
                            console.log(err.message);
                            res.render('signIn', { error: "Usuario o contraseña inválido" })
                        });
                });
            }
        });
});
//-----------Change pass-----------------
router.get('/changepass', (req, res) => {
    res.render('changepass');
});
router.post('/changepass', (req, res) => {
    let email = req.body.email;
    console.log("EMAIL: ", email);
    firebase.auth().sendPasswordResetEmail(email).then(function () {
        // Email sent.
        console.log("Email enviado")
    }).catch(function (error) {
        console.log(error)
        // An error happened.
    });
    res.redirect('signIn');
});
//---------------------------------------

router.get('/signUp', (req, res) => {
    res.render('signUp');
})

router.post('/newUser', (req, res) => {
    console.log(req.body);
    const newUser = {
        firstname: req.body.name,
        email: req.body.email,
        username: req.body.username,
    };

    firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
        .then((userDetails) => {
            console.log(userDetails.user.uid);
            db.collection("users").doc(userDetails.user.uid).set(newUser);
            res.render('signIn');
        })
        .catch(err => console.log(err));
});


//--------
router.get('/principal', (req, res) => {
    db.collection('houses').where('owner', '==', firebase.auth().currentUser.uid).get().then((snapshot, lisdt) => {
        var array = [];
        snapshot.docs.forEach(doc => {
            var datos = doc.data();
            const desc = {
                nameHouse: datos.nameHouse,
                direction: datos.direction
            }
            array.push(desc);
            //console.log(datos);
        })
        let uid = firebase.auth().currentUser.uid;
        res.render('principal', { listhomes: array, userUID: uid });
    });
});


//----------

router.get('/addHome', (req, res) => {
    res.render('addHouse');
});


router.post('/addHome', (req, res) => {
    const newHome = {
        nameHouse: req.body.nameHouse,
        direction: req.body.direction,
        owner: firebase.auth().currentUser.uid
    };
    db.collection('houses').add(newHome);
    res.redirect('/principal');
});
//-----------------
router.get('/delete/:nameHouse', (req, res) => {
    const { nameHouse } = req.params;
    db.collection('houses').where('nameHouse', '==', nameHouse).get().then((snapshot) => {
        snapshot.docs.forEach(doc => {
            db.collection('houses').doc(doc.id).delete();
        })
        res.redirect('/principal');
    });
    //res.redirect('/principal');
});
//---------------------
/*router.get('/edit/:nameHouse/:direction', (req, res) =>{
    const { nameHouse, direction } = req.params;
    
    //var IDedit;
    var toEdit;
    db.collection('houses').where('nameHouse','==',nameHouse).get().then((snapshot) =>{
        snapshot.docs.forEach( doc => {
            toEdit = {
                id: doc.id,
                nameHouse: nameHouse,
                direction: direction
            }
            console.log(toEdit);
            //res.render('editHouse', {editHouse: toEdit});
        })
    });
    res.render('editHouse', {editHouse: toEdit});
    
});*/
router.get('/edit/:nameHouse', (req, res) => {
    const { nameHouse } = req.params;

    //var IDedit;

    db.collection('houses').where('nameHouse', '==', nameHouse).get().then((snapshot) => {
        var array = [];
        snapshot.docs.forEach(doc => {
            var id = doc.id;
            var datos = doc.data();
            var toEdit = {
                id: id,
                nameHouse: datos.nameHouse,
                direction: datos.direction
            }
            array.push(toEdit);
            //console.log(array);
            //res.render('editHouse', {editHouse: toEdit});
        })
        res.render('editHouse', { editHouse: array[0] });
    });
});


//router.post('/editHouse/:id/:nameHouse/:direction', (req, res)=> {
router.post('/editHouse', (req, res) => {
    //const { id, nameHouse, direction } = req.params;
    //const { id } = req.params;
    const id = req.body.id;
    //instalar body-parser
    //console.log("el id: ",id);
    //console.log("el name: ",nameHouse);
    //console.log("el direct: ",direction);
    /*db.collection('houses').doc(id).update({
        nameHouse: nameHouse,
        direction: direction
    }).then( function(){
        console.log("updated");
    }).catch(function(error){
        console.error("error: ", error);
    });*/
    console.log(req.body.nameHouse);
    console.log(req.body.direction);
    db.collection('houses').doc(id).update({
        nameHouse: req.body.nameHouse,
        direction: req.body.direction
    }).then(function () {
        console.log("updated");
    }).catch(function (error) {
        console.error("error: ", error);
    });
    res.redirect('/principal');
});

//-------List Rooms
router.get('/listRooms/:nameHouse', (req, res) => {
    const { nameHouse } = req.params;
    //const idHouse;
    db.collection('houses').where('nameHouse', '==', nameHouse).get().then((snapshot) => {
        var array1 = [];
        snapshot.docs.forEach(doc => {
            var id = doc.id;
            array1.push(id);
        })
        db.collection('room').where('idHouse', '==', array1[0]).get().then((snapshot) => {
            var array = [];
            snapshot.docs.forEach(doc => {
                var datos = doc.data();
                const desc = {
                    idHouse: array[0],
                    nameRoom: datos.nameRoom
                }
                array.push(desc);
                //console.log(datos);
            })
            res.render('listRooms', { listrooms: array, idHouse: array1[0] });
        });
    });
    //console.log(idHouse);
    /*db.collection('room').where('idHouse','==',).get().then((snapshot) => {
        var array = [];
        snapshot.docs.forEach(doc => {
            var datos = doc.data();
            const desc = {
                idHouse: array[0],
                nameRoom: datos.nameRoom
            }
            array.push(desc);
            //console.log(datos);
        })
        res.render('listRooms',{listrooms : array});
    });*/
});

//-------Add rooms
router.get('/addRoom/:idHouse', (req, res) => {
    const { idHouse } = req.params;
    const x = {
        idHouse: idHouse
    }
    var array = [];
    array.push(x);
    res.render('addRoom', { infroom: array[0] });
});
router.post('/addRoom', (req, res) => {
    const newRoom = {
        nameRoom: req.body.nameRoom,
        idHouse: req.body.idHouse
    };
    db.collection('room').add(newRoom);
    var namehouse;
    db.collection('houses').doc(req.body.idHouse).get().then(doc => {
        const data = doc.data();
        namehouse = data.nameHouse;
        var url = '/listRooms/' + namehouse;
        res.redirect(url);
    })

});
//-----Delete room
router.get('/deleteRoom/:nameRoom', (req, res) => {
    const { nameRoom } = req.params;
    db.collection('room').where('nameRoom', '==', nameRoom).get().then((snapshot) => {
        var url;
        snapshot.docs.forEach(doc => {
            db.collection('houses').doc(doc.data().idHouse).get().then(doc1 => {
                const data = doc1.data();
                namehouse = data.nameHouse;
                url = '/listRooms/' + namehouse;
                db.collection('room').doc(doc.id).delete();
                res.redirect(url);
            })

        })
    });
});
//----
router.get('/editRoom/:nameRoom', (req, res) => {
    const { nameRoom } = req.params;
    db.collection('room').where('nameRoom', '==', nameRoom).get().then((snapshot) => {
        var array = [];
        snapshot.docs.forEach(doc => {
            var id = doc.id;
            var datos = doc.data();
            var toEdit = {
                id: id,
                nameRoom: datos.nameRoom
            }
            array.push(toEdit);
            //console.log(array);
            //res.render('editHouse', {editHouse: toEdit});
        })
        res.render('editRoom', { editRoom: array[0] });
    });
});

router.post('/editRoom', (req, res) => {
    db.collection('room').doc(req.body.id).get().then(doc => {
        var url;
        db.collection('houses').doc(doc.data().idHouse).get().then(doc1 => {
            const data = doc1.data();
            namehouse = data.nameHouse;
            url = '/listRooms/' + namehouse;
            db.collection('room').doc(req.body.id).update({
                nameRoom: req.body.nameRoom
            });
            res.redirect(url);
        })
    });
});
//----
router.get('/listSensors/:nameRoom', (req, res) => {
    const { nameRoom } = req.params;
    let idRoom = "";

    db.collection('room').where('nameRoom', '==', nameRoom)
        .limit(1)
        .get()
        .then((snapshot) => {
            idRoom = snapshot.docs[0].id;
            return db.collection('sensor').where('idRoom', '==', idRoom).get();
        })
        .then((snapshot) => {
            let aPromises = [];
            snapshot.docs.forEach(doc => {
                let idhwsensor = doc.data().idhwsensor;
                aPromises.push(db.collection('hwsensor').doc(idhwsensor).get());
            });
            return Promise.all(aPromises);
        })
        .then((snapshots) => {
            let listsensors = [];
            snapshots.forEach((snapshot) => {
                const desc = {
                    idRoom: idRoom,
                    nameSensor: snapshot.data().nameSensor,
                    unit: snapshot.data().unit
                };
                listsensors.push(desc);
                console.log(snapshot.data());
            });
            res.render('listSensors', { listsensors: listsensors, idRoom: idRoom });
        });
});

//    // db.collection('hwsensor').doc(doc.data().idhwsensor).get().then( (snapshot1) => {});
//     snapshot1.docs.forEach( doc1 => {
//         const data = doc1.data();
//         const desc = {
//             idRoom : array1[0],
//             nameSensor : data.nameSensor,
//             unit : data.unit
//         };    
//         array.push(desc);
// });
//  res.render('listSensors',{listsensors : array, idRoom: array1[0]});




// db.collection('room').where('nameRoom','==',nameRoom).get().then((snapshot) =>{
//     var array1 = [];
//     snapshot.docs.forEach( doc => {
//         var id = doc.id;
//         array1.push(id);
//     })
//     db.collection('sensor').where('idRoom','==',array1[0]).get().then((snapshot) => {
//         //var array = [];
//         snapshot.docs.forEach(doc => {
//             //var datos = doc.data();

//             /*const desc = {
//                 idRoom: array1[0],
//                 nameSensor: datos.nameSensor,
//                 unit: datos.unit
//             }*/

//            //...
//             db.collection('hwsensor').doc(doc.id).get().then( (snapshot) => {
//                 //doc1 => {
//                     var array = [];
//                     snapshot.docs.forEach( doc1 => {
//                         const data = doc1.data();
//                         const desc = {
//                             idRoom : array1[0],
//                             nameSensor : data.nameSensor,
//                             unit : data.unit
//                         };    
//                         array.push(desc);
//                     })
//                     res.render('listSensors',{listsensors : array, idRoom: array1[0]});

//                 console.log("arreglo prueba",array);

//             })



//             //...
//             //console.log("data desc: ",desc);
//             //array.push(desc);

//         })
//         //res.render('listSensors',{listsensors : array, idRoom: array1[0]});
//     });
// });


//----
router.get('/addSensor/:idRoom', (req, res) => {
    const { idRoom } = req.params;
    const x = {
        idRoom: idRoom
    }
    var array = [];
    array.push(x);
    res.render('addSensor', { infsensor: array[0] });
});


router.post('/addSensor', (req, res) => {
    //console.log('idroom: ', req.body.idRoom);
    //console.log('codesensor: ', req.body.codeSensor);
    db.collection('hwsensor').doc(req.body.codeSensor).get().then(doc1 => {
        if (doc1.exists) {
            /*
            const sensor = {
                idRoom: req.body.idRoom,
                nameSensor: doc1.data().nameSensor,
                unit: doc1.data().unit
            }*/
            const sensor = {
                idRoom: req.body.idRoom,
                idhwsensor: doc1.id
            };
            console.log("----",sensor);
            db.collection('sensor').add(sensor);
            var nameRoom;
            db.collection('room').doc(req.body.idRoom).get().then(doc => {
                const data = doc.data();
                nameRoom = data.nameRoom;
                var url = '/listSensors/' + nameRoom;
                res.redirect(url);
            })
        } else {
            var url2 = '/addSensor/' + req.body.idRoom;
            res.redirect(url2);
        }

    })
})

//-----
router.get('/deleteSensor/:nameSensor', (req, res) => {
    const { nameSensor } = req.params;
    console.log('namesensor: ',nameSensor);
    /* 
    db.collection('sensor').where('nameSensor', '==', nameSensor).get().then((snapshot) => {
        var url;
        snapshot.docs.forEach(doc => {
            db.collection('room').doc(doc.data().idRoom).get().then(doc1 => {
                const data = doc1.data();
                nameRoom = data.nameRoom;
                url = '/listSensors/' + nameRoom;
                db.collection('sensor').doc(doc.id).delete();
                res.redirect(url);
            })

        })
    });
    */
   //-----
    db.collection('hwsensor').where('nameSensor', '==', nameSensor).get().then((snapshot) => {
        var url;
        snapshot.docs.forEach(doc => {
            console.log("-- ",doc.id);
            db.collection('sensor').where('idhwsensor','==',doc.id).get().then((snapshot0) => {
                snapshot0.docs.forEach( doc1 => {
                    const data = doc1.data();
                    console.log(data);
                    db.collection('room').doc(data.idRoom).get().then(doc2 =>{
                            console.log("---",doc2.data().nameRoom);
                            url = '/listSensors/' + doc2.data().nameRoom;
                            console.log('doc2nameRoom: ',doc2.data().nameRoom);
                            db.collection('sensor').doc(doc1.id).delete();
                            res.redirect(url);
                        })
                         
                    }) 
                })
                
                //nameRoom = data.nameRoom;
                
                //     
            })

        })
    //-----
});
//----
router.get('/editUnit/:nameSensor', (req, res) => {
    const { nameSensor } = req.params;
    /* 
    db.collection('sensor').where('nameSensor', '==', nameSensor).get().then((snapshot) => {
        var array = [];
        snapshot.docs.forEach(doc => {
            var id = doc.id;
            var datos = doc.data();
            var toEdit = {
                id: id,
                unit: datos.unit
            }
            array.push(toEdit);
            console.log(array);
            //res.render('editHouse', {editHouse: toEdit});
        })
        res.render('editUnitSensor', { editUnitSensor: array[0] });
    });
    */
    db.collection('hwsensor').where('nameSensor', '==', nameSensor).get().then((snapshot) => {
        var array = [];
        snapshot.docs.forEach(doc => {
            var id = doc.id;
            var datos = doc.data();
            var toEdit = {
                id: id,
                unit: datos.unit
            }
            array.push(toEdit);
            console.log(array);
            //res.render('editHouse', {editHouse: toEdit});
        })
        res.render('editUnitSensor', { editUnitSensor: array[0] });
    });
});

router.post('/editUnitSensor', (req, res) => {
    console.log('cuerpo: ', req.body.newUnit);
    /*
    db.collection('sensor').doc(req.body.id).get().then(doc => {
        var url;
        db.collection('room').doc(doc.data().idRoom).get().then(doc1 => {
            const data = doc1.data();
            nameRoom = data.nameRoom;
            url = '/listSensors/' + nameRoom;
            db.collection('sensor').doc(req.body.id).update({
                unit: req.body.newUnit
            });
            res.redirect(url);
        })
    });
    */
    db.collection('hwsensor').doc(req.body.id).get().then(doc => {
        var url;
        db.collection('sensor').where('idhwsensor','==',doc.id).get().then((snapshot) =>{
            snapshot.docs.forEach(doc1 => {
                const data = doc1.data();
                db.collection('room').doc(data.idRoom).get().then( doc2 => {
                    nameRoom = doc2.data().nameRoom;
                    url = '/listSensors/' + nameRoom;
                    db.collection('hwsensor').doc(req.body.id).update({
                        unit: req.body.newUnit
                    });
                    res.redirect(url);
                })
                
            })
        })
        
    });

});
//---
router.get('/logOut', (req, res) => {
    firebase.auth().signOut()
        .then(() => {
            res.render('signIn');
        });

});
//-------
module.exports = router;
