
var currLat;
var currLon;
var currAlt;
let tempLat;
let tempLon;
let tempAlt;
var currHeading;
var currX;
var currZ;
var initLat;
var initLon;
var initAlt;
var initHeading;
var init = false;

const cam = document.getElementById("camera");
const demo = document.getElementById("demo");
const hello = document.getElementById("hello");


const username = localStorage.getItem("username");
const password = localStorage.getItem("password");


//Storing Position i.e. starting AR world
async function getLocation() {
    let promise = new Promise(resolve => {
        let exists = false;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(storePosition);
            if (currLat != null && currLon != null && currAlt != null) {
                exists = true;
            }
        } else {
            demo.innerHTML = "Geolocation is not supported by this browser.";
        }
        setTimeout(() => resolve(exists), 500); // resolve
    });

    // wait for the promise to resolve
    let value = await promise;
    return value;
}

function storePosition(position) {
    currLat = 33.776493;
    currLon = -84.400088;
    currAlt = 291;

    /*
    currLat = position.coords.latitude;
    currLon = position.coords.longitude;
    currAlt = position.coords.altitude;
    */

    tempLat = currLat;
    tempLon = currLon;
    tempAlt = currAlt;
    if (currLat == null || currLon == null || currAlt == null) {
        demo.innerHTML = "Lat, Lon, or Alt isn't storing";
    }
    currHeading = 0;
    //calculateHeading();
    if (init === false) {
        initLat = currLat;
        initLon = currLon;
        initAlt = currAlt;
        initHeading = currHeading;
        init = true;
    }

    currX = 0;
    currZ = 0;
    cam.setAttribute('position', {
        x: currX,
        y: currAlt,
        z: currZ
    });
}
storePosition();
//setInterval(function() {updatePosition(); }, 3000);
//Updating the Position - Occurs every 3 seconds and only updates if you move more than 7 meters
function updatePosition() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updatePositionHelper);
    } else {
        demo.innerHTML = "Geolocation cannot be updated.";
    }
}
function updatePositionHelper(position) {
    tempLat = currLat;
    tempLon = currLon;
    //tempLat = position.coords.latitude;
    //tempLon = position.coords.longitude;
    //tempAlt = position.coords.altitude;
    let changeInXDistance = calculateDistance(tempLat, currLat, tempLon, currLon);
    let changeInYDistance = tempAlt - currAlt;
    let changeInTotalDistance = Math.sqrt(Math.pow(changeInXDistance, 2) + Math.pow(changeInYDistance, 2));
    if (changeInTotalDistance > 5) {
        currLat = tempLat;
        currLon = tempLon;
        currAlt = tempAlt;
        let changeInBearing = calculateBearing(tempLat, currLat, tempLon, currLon);
        currX = currX + changeInXDistance * Math.sin(toRadians(changeInBearing));
        currZ = currZ + changeInXDistance * -1 * Math.cos(toRadians(changeInBearing));
        cam.setAttribute('position', {
            x: currX,
            y: currAlt,
            z: currZ
        });
    }
}

function placeObjs() {
    var objects = firebase.database().ref('objects');
    objects.once('value').then(function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            let objectName = childSnapshot.key;
            let object = `${childSnapshot.key}`;
            if (snapshot.child(object + '/public').val()) {
                let latitude = snapshot.child(object + '/latitude').val();
                let longitude = snapshot.child(object + '/longitude').val();
                let altitude = snapshot.child(object + '/altitude').val();
                let objectCreator = snapshot.child(object + '/username').val();
                if (snapshot.child(object +'/type').val() === 'txt') {
                    let fileName = snapshot.child(object + '/text').val();
                    console.log(fileName);
                    createObjectTxt(latitude, longitude, altitude, fileName);
                }
            }
        });
    });
}
placeObjs();


async function createObjectTxt(objLatitude, objLongitude, objAltitude, fileName) {
    let positioned = await getLocation();
    if (positioned) {
        let distance = calculateDistance(currLat, objLatitude, currLon, objLongitude);
        if (distance < 125000) {
            let bearing = currHeading + calculateBearing(currLat, objLatitude, currLon, objLongitude);
            let x = distance * Math.sin(toRadians(bearing));
            let y = objAltitude;
            let z = distance * -1 * Math.cos(toRadians(bearing));
            let el = document.createElement('a-entity');
            el.setAttribute('text', {
                value: fileName
            });
            //el.object3D.scale.set(.1, .1, .1);
            el.setAttribute('position', {
                x: x,
                y: y,
                z: z
            });
            let sceneEl = document.querySelector('a-scene');
            sceneEl.appendChild(el);
        }
    }
}


//Sets current heading as the difference between North and user heading.
function calculateHeading() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", function (event) {
            if ('ondeviceorientationabsolute' in window) {
                window.ondeviceorientationabsolute = function(event) {
                    currHeading = event.alpha;
                    return true;
                };
            } else if(event.webkitCompassHeading) {
                var compass = event.webkitCompassHeading;
                handleOrientationEvent(compass);
                return true;
            } else if (event.absolute == true) {
                var compass = event.alpha;
                handleOrientationEvent(compass);
                return true;
            } else {
                demo.innerHTML = "<br>Compass Heading Not Working";
                return false;
            }
        }, true);
    } else {
        demo.innerHTML = "<br>Compass Heading Not Working";
        return false;
    }
}
function handleOrientationEvent(compass) {
    currHeading = compass;
}
function toDatabase() {
    location.assign('../database');
}
function teleport() {
    let lat = document.getElementById("teleLat").value;
    let lon = document.getElementById("teleLon").value;
    let changeInBearing = calculateBearing(lat, currLat, lon, currLon);
    let changeInXDistance = calculateDistance(lat, currLat, lon, currLon);
    currX = currX + changeInXDistance * Math.sin(toRadians(changeInBearing));
    currZ = currZ + changeInXDistance * Math.cos(toRadians(changeInBearing));
    cam.setAttribute('position', {
        x: -currX,
        y: currAlt,
        z: currZ
    });
    currLat = lat;
    currLon = lon;
}

