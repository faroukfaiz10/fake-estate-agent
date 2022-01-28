// 1- get bearer token (7 days expiration time): Easiest way is to go to https://ibail.arpej.fr/residences/KR/reservation-d-un-logement and get it from netwok calls
// Other method is to get itby posting to https://admin.arpej.fr/api/oauth/token with the crediantials in https://ibail.arpej.fr/js/app.0c2f44e6.js (file name likely to change@@)

// 2- Call https://www.arpej.fr/wp-json/sn/residences?lang=fr&display=map&related_city[]=52524&price_from=0&price_to=1000&show_if_full=false&show_if_colocations=false to get list of residences and their urls.

// 3 - Get two letters id (e.g. KR) from reserver button url link in residence page that u got from step 2 (e.g. https://www.arpej.fr/fr/residence/porte-ditalie-residence-etudiante-le-kremlin-bicetre/)

// 4 - Get number id by calling https://admin.arpej.fr/api/customer/residences/KR (replace KR with the residence 2letter id got from step 3)

// 5 - Replace {ID} in https://admin.arpej.fr/api/customer/residences/{ID}/availabilities/2022-01/offers with the id from step 4 to get the availabilities for that residence.