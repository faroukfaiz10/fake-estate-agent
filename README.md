
# crous-arpej
The project is a bot that checks for housing in Crous and Arpej residences, which are known to be the hardest to get in France, especially in Paris. 
For the Crous which is more challenging to get, as housing disappears as soon as it shows up, the bot can do the reservation for you.

# Configuration
## Arpej

Arpej's bot can be configured with two environment variables that can be found on the `.env` file: `ARPEJ_URL` and `USE_ARPEJ_WHITELIST`.

### ARPEJ_URL (required)
To use the Arpej bot, the `ARPEJ_URL` environment variable must be set.

Its minimal form is `https://www.arpej.fr/wp-json/sn/residences` to get all residences in France that are not full. 
But it can accept more query params like `price_from`, `price_to`, `show_if_colocations`, `related_city[]`, `show_if_full`, etc. 
You can learn more by filtering the `Fetch/XHR` requests on Arpej's residences [search page](https://www.arpej.fr/fr/nos-residences).

### USE_ARPEJ_WHITELIST (optional)

It's possible to use a whitelist of residences to filter by. To enable that, the `USE_ARPEJ_WHITELIST` environment variable must be set to true.
For that you will need to update the array `WHITELIST` in `arpej.js` with the links to the residences that you want to be alerted on.
Note that the format must be respected: Start with `https://` and end with `/` as that's how residences links are stored on Arpej's databases. 
An example of a valid residence link is `"https://www.arpej.fr/fr/residence/renon-residence-etudiante-vincennes/"`

## Crous
Crous' bot can be configured with three environment variables that can be found on the `.env` file: `CROUS_URL` and `EMAIL` and `PASSWORD`.

### CROUS_URL (required)
To use the Crous bot, the `CROUS_URL` environment variable must be set. 

Its minimal form is `https://trouverunlogement.lescrous.fr/tools/flow/21/search` to get all residences in France that are not full.
But it can accept more query params like `bounds`, `price`, etc...
The easiest way to get this URL is to go the Crous' "Find accommodation" [page](https://trouverunlogement.lescrous.fr/tools/flow/21/search) and customize your bounds (e.g. by selecting a city) then copy the generated URL from the address bar.

### EMAIL and PASSWORD (optional)

To enable the bot to make reservations for you, you will need to provide your email and password credentials for the [messervices.etudiant.gouv.fr](https://www.messervices.etudiant.gouv.fr) service login.
If the `EMAIL` and `PASSWORD` environment variables in `.env` are set. The bot will try to make a reservation of a free residence as soon as possible.

For booking an accommodation, documents are needed to be submitted. You will need to put them in a documents' directory in the project's root dir. 
The default names for the expected documents are shown in the tree below.
They can also be changed from the `bookSelectedResidence` method of the `crous.js` file.
```
documents
├── attestation_de_stage.pdf
├── certificat_de_scolarite.pdf
├── justificatif_de_niveau_d_etude.pdf
└── justificatif_de_ressources.pdf
```

Note that you still can use the bot without your credentials to only be notified when a housing is free.

### Blacklist

Since the Crous' bot can be configured to book an accommodation when a residence is free, a blacklist is needed to avoid making reservations in residences you don't want (but still show up in the bounds you specified in the URL above).
This variable is a list of residences full names that should be updated directly from the `crous.js` file. The residence's full name (contains address) is the one found on its card under the picture and the housing type. It usually has the format `RESIDENCE_NAME(RESIDENCE_ADDRESS)`

## Discord (Notifications)

At the moment, only discord notifications are supported. Other notification strategies can be added easily.
To configure discord notifications, you need to have a webhook URL to a server's channel. This [tutorial](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) shows how to get such URL.
Note that you can always create your own server if your permissions in other servers do not allow for adding integrations.

Finally, set the environment variable `DISCORD_URL` in `.venv` to that webhook URL.


# How to use

## Install dependencies
Run ```npm install```

## Run
```
Crous           : npm run crous
Arpej           : npm run arpej
Crous & Arpej   : npm start
```
---

Improvements
- Better error/exceptions handling
- Add support for other notification strategies.
- Add logging
- Ask for confirmation before booking residence.
