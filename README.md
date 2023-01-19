# WebLoadBreaker (by CodeArt)
Open source, pure browser based (vanilla js) load testing tool for webpages.
This single-page tool will run in your local browser and emulate a number of concurrent users hitting a given url to see if the server can handle the load.

It is intended to be used to load test on internal development environments or pre-production environments - in order to investigate how efficient code changes has been to enhance the performance and resilience.

After the test is completed you can see the key metric Requests Per Second that came through the server as well as min, max, average and median times.

*[Try it here!](https://labs.codeart.dk/WebLoadBreaker/)*

## Known issues 
- There is still a lot of outstanding stability work, validation of input and further testing needed.
- There is currently no check on which results come back from the tested urls. So it might be 404 or Access Denied you are measuring. 
- When testing high volume of concurrent simulated users, be aware that your browser might be the bottleneck slowing down your measurements and not the server.
