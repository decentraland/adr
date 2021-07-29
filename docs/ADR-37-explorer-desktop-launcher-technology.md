#  Explorer Desktop Launcher Technology

## Context and Problem Statement

We need an Application that can be able to install and update the Desktop Client easily.

It must be compatibly cross-platform between Windows, macOS and Linux.

The launcher will be the main application that the user will download from the website. So it must be a small size app.

To make this application we need to choose in which technology we're going to create it.

##  Considered options

### Option A
Use a native app using the Qt library in C++.

#### Advantages
- Using this approach, we can create a speedy app and with very low overhead that runs smoothly cross-platform Windows/Mac/Linux
- We can use the Launcher as an Error Catcher

#### Disadvantages
- There are not many developers in DCL that known this technology to maintain the platform

### Option B
Update directly from Unity and self-update the client

#### Advantages
- We can deploy a simple game that self-update
- We don't need to maintain two apps (Desktop Client and Desktop Launcher)

#### Disadvantages
- Some technical doubts that if Unity can self-update and work well.
- Having everything in one app can be a problem. The application has more than one responsibility, and maybe the Desktop Client can interfere with some functionality of the Launcher.
- We can't use the Launcher as an Error catcher because everything is in one app
- The app can be huge in size

### Option C
Create an Electron App with React JS

#### Advantages
- Easy to maintain, DCL has a team of React JS developers
- It has a self-update integrated
- We can add more features to it, like stats or a section of news and updates.
- We can use the Launcher as an Error Catcher

#### Disadvantages
- The app can be a bit heavy in size

##  Decision

We will choose option **C**, `Electron App with React JS`. There are many advantages, for example, that we can split the development of the app into multiple teams. It has the self-update feature integrated so we can deliver a product faster.

More details of how the application will work: https://www.notion.so/decentraland/Desktop-Launcher-ed6aadd11d7b4fd48e5a88400d761ed9


##  Participants

Date: 2021-07-29

- Alvaro
- Brian
- Mateo
- Mendez