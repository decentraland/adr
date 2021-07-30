#  Explorer Desktop Launcher Technology

## Context and Problem Statement

The Desktop Client Project needs an Application that can easily install and update the Desktop Client.

It must be compatible cross-platform with Windows, macOS and Linux.

The launcher will be the main application that the user will download from the website. So it must be a small size app.

To make this application, the team considered the following options.

##  Considered options

### Option A
Use a native app using the Qt library in C++.

#### Advantages
- Using this approach, it will be a speedy app with very low overhead that runs smoothly cross-platform Windows/Mac/Linux
- The Launcher can be used as an Error Catcher

#### Disadvantages
- There are not any projects with this technology at decentraland

### Option B
Update directly from Unity and self-update the client.

#### Advantages
- The app can be deployed as a simple game that can self-updated
- There is no need to maintain two apps (Desktop Client and Desktop Launcher)

#### Disadvantages
- Some technical doubts about whether Unity can be self-updated without major problems.
- Having everything in one app can be a problem. The application has more than one responsibility, and maybe the Desktop Client can interfere with some functionality of the Launcher.
- The Launcher can't be used as an Error catcher because everything is in one app
- The app can be huge in size

### Option C
Create an Electron App with React JS

#### Advantages
- Easy to maintain. There are plenty of react projects in decentraland
- It has a self-update feature integrated
- More features can be added to it, like stats or a section of news and updates.
- The Launcher can be used as an Error Catcher

#### Disadvantages
- The app can be a bit heavy in size

##  Decision

The selected option it's option **C**, `Electron App with React JS`. There are many advantages: for example, that the project can be split up into multiple teams. It has the self-update feature integrated so the team can deliver the product faster.

More details of how the application will work: https://www.notion.so/decentraland/Desktop-Launcher-ed6aadd11d7b4fd48e5a88400d761ed9

##  Participants

Date: 2021-07-29

- Alvaro
- Brian
- Mateo
- Mendez
