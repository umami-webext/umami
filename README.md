# umami

An e621 browser extension

The code is awful and old, it was a simple script that grew out of control

## Build

### Requirements
 - node 10
 - npm 6
 
### Steps
 - run `npm ci` to install dependencies
 - run `npx gulp` to build the dist folder
 - run `npx gulp zip` to zip the addon
 - run `npx gulp firefox` to build the firefox addon
 - run `npx gulp chrome` to build the chrome addon
 
