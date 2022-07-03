# TONeful

TONeful is a 1-to-1 video call app dedicated to improve the service quality of professionals – it charges the customers in consultation sessions per minute or even per second, instead of per session. The professionals are able to set their TON rate before the calls, and the customers will need to agree upon it before the calls start. A timer will be visible to both the professional and the customer during a call, and the customer will be able to pause or stop the timer anytime they wish.

In short, TONeful enables:

the customers to talk 1-to-1 with the professionals without being interrupted by session limitations, and only being charged according to their service quality
the high-quality professionals to be rewarded by receiving the TONs they deserve.

This repo is dedicated to the first prototype of TONful. We introduce basic functionalities of the app, both frontend and backend. Unfortunately, by the time we have to wrap up everything, the frontend (other folders in repo) and backend (backend.js) part of this app is not connected yet. Additionally, the frontend part is also still having minor caching problem, which causes the credit of customers not being updated regularly as expected (only update after refreshing the browser!).

##App technologies and how to run:

* TONeful server: `node ton/server.js`. 
This opens an Express.js server on port 8888, which is triggers the TON JavaScript SDK `backend.js` - or its mocked version `mocked_backend.js`.

* "Phone call" buttons web server:  `python buttons/app.py`
This opens a Flask server on port 5000, which serves the HTML/CSS/JQuery for the "phone call" buttons and talks with the TONeful server above via its API. 

More introduction and YouTube link on GitHub Pages: https://k-monty.github.io/hackaTON/
