# Jeffrey's Music Listening Times - https://music-listening-times.web.app/
Created by Jeffrey Tram  
Project Duration: Feb 2020 - May 2020

Visualizing almost 2 years of my music listening data!  

## Running the code
### Firebase
[Set up the Firebase application.](https://firebase.google.com/docs/web/setup)
This application uses Cloud Functions (required) and Firebase Hosting (not required).

### Getting a Last FM API key
[Go to this link to obtain your own Last FM API key.](https://www.last.fm/api/). The key will allow the display of the album art and artist tags.

### Setting up environment variables
[If using the Last FM API key, you need to setup your environment variables in Firebase](https://firebase.google.com/docs/functions/config-env)  
**NOTE:** This requires Firebase's "Pay as you go" (Blaze) plan as the free (Spark) plan restricts outbound networking to Google services only.
