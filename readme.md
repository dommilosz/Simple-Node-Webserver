# Simple node web server

Simple node web server is a modular express server created in Typescript. 

#### Included modules:
- accountAuth (Allows creating user accounts with custom permissions. Adds register form.)
- adminPanel (Allows navigating between an admin only things)
- dataLogger (Allows saving data and further reading it)
- fileHost (Creates endpoints for files added by other modules. Files can have custom permissions needed to access)
- hashesPanel (Allows viewing active and expired authentication hashes)
- settingsPanel (W.I.P - Will allow editing config.json and restarting server)

#### Authentication:

Without `accountAuth` module authentication is very simple - Username can be anything, password is saved in config. Entering admin password gives you \*.\* permissions, entering user password - user.*.
Server then generates random hash token used with username to not send password over and over.

`accountAuth` module allows server to have different users with different permissions and different passwords. To change user list use builtin in accountAuth module endpoint `/accounts`

#### Permissions:

Server uses minecraft bukkit like permissions system. 

\*.\* allows for all actions.

Every other permission like `user.settings.*` allows for `user.settings` and everything under `user.settings`

## Installation
- Clone the repository.
- Install node modules - `npm install`
- Wait.....
- Start it with: 

    `npm start` - normal startup.

    `npm debug` - start with nodemon.
    
#### Usage:
- Go to any endpoint
- Login in login form

## Creating your own modules

Modules have access to almost everything in the webserver. Modules can create endpoints alter authentication flow and many more. Even can change login page.

Modules are read by modulesHandler. It iterates for every folder in src/modules and if the folder contains .ts file with the same name loads it.  