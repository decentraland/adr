---
layout: doc
rfc: 15
date: 2022-11-01
title: SDK Playground
status: DRAFT
authors:
  - nearnshaw
---


# Abstract

This document presents the Playground, a new learning tool for SDK users, focused on learning by doing. It’s a light web editor where you can quickly write and iterate code and see its effects side by side. Users don’t need to install or set up anything, removing all friction. No file management, saving or deploying, it’s meant for prototyping code and throwing it away, or then pasting somewhere else. 

# Need

Learning to use the SDK is tricky, and there’s a lot of friction up front until you have everything set up and ready to actually run code and see its effects. If you’re new to the Decentraland SDK, you don’t know if you’ll feel comfortable and capable enough to use the tools, and if all that set up will even be worth it. So it’s good to get a taste of what it’s like to use our SDK before you start the setup.
When we release SDK7, all the developers in our community will have to learn a new syntax, and in many cases a new programming style (Data Oriented Programming). It will be a challenge to get them to transition to this new version, anything that can help them learn faster is valuable.

To experienced users of the SDK, this is also super valuable. When you encounter a new feature, or when you have a doubt about some corner case, you currently have three options:

- You stick to just reading the docs and you make assumptions about how things work in different scenarios. You might never have that *aha!* moment where you fully understand the mechanic, so you blindly copy snippets you don’t understand.
- You go through the trouble of setting up a new project and run tests there. This is time consuming, and takes plenty of initiative. You also end up with dozens of junk projects with little experiments (I have a folder named “horrible tests” currently holding 136 projects like that!).
- You mess around with your real projects and risk braking them, or accidentally leaving some test when you ship to production. You also likely need to put up with longer load times between tests, just to load the rest of your content. If something doesn’t go as expected, you’ll also have a harder time debugging with everything else that’s going on in the scene.

Thanks to this playground, if any doubt comes to your mind, you’re a click away from jumping into a safe and easy test environment.

Developing an initial version of this tool would not take much extra effort, given that something similar is already being built for internal testing of the SDK7. The effort put into this is also likely reusable as part of the [Decentraland Editor](https://github.com/decentraland/editor), a much more ambitious tool meant for creating fully-fledged content.

# Approach

This tool will be similar to other existing developer playgrounds.
In other playgrounds, there’s a code **input** panel on the left, and a **visual output** on the right. 
There’s a *Play*  or *Run* button, to convert the code into visual output, and that’s essentially all there is to it.

You should be able to start up the playground with different initial states:

- Write code from scratch, starting off from a template scene that includes some very basic code (like the cube template scene).
- Every code snippet in our docs site should include a link to the playground, where you’ll find that same code pre-populated. Then you can make tweaks to that snippet, or change it entirely.
- Fetch any example scene from the awesome repository, and start working from there.

# Benefit

Learning by doing is a LOT more effective. By reducing the friction it takes to try things, developers will try out a lot more things, and will learn a lot faster. It’s a game-changer feature for the experience of using our documentation.

For new users, they can have an easy and frictionless first experience writing code with the Decentraland SDK, before they set up everything to start building their own scenes. That way they might feel more reassured that all that setup and learning is worth the effort.

For users that might be on the fence about transitioning their work to SDK7, this can be a huge help to make them more confident that they can get there.

The tool we’re planning to build follows a pattern that is familiar and well known to developers in other platforms. It’s similar to [w3Shools](https://www.w3schools.com/tryit/), [Babylon Playground](https://playground.babylonjs.com/), or Mulesoft’s [DataWeave](https://developer.mulesoft.com/learn/dataweave/playground). These tools are all loved by the dev communities that use them, we expect our playground to also be very valued by our content creators. 

# Competition

Alternatives:

- Rely purely on documentation and examples

  We absolutely need to have good documentation and examples, but these will always cover limited ground. Allowing the imagination of users to run free and try their own variations on examples is always going to be valuable.
- Focus work directly on the Decentraland Editor

  The Decentraland Editor will take a long time to be developed. Initial versions of the Decentraland Editor will likely still not be a single-install product, they’ll surely have a bunch of dependencies and hurdles (node, OS permissions, launching via command line). Once the editor is finalized, it’ll be a huge help to onboard more users to SDK7, but we can’t wait till then.
Even after the release of the Decentraland Editor, the playground will remain useful. Using the Playground will always have less friction than the Editor, as it’ll require no installation, it will open faster, and not bother with creating projects, folders, etc.
Also, as mentioned, a similar tool to the playground is already in development, making it a relatively low hanging fruit to develop.

# Non-goals

- This will be built for SDK7, not for older versions of the SDK, as that would imply extra work.
- This tool is not meant to be an editor for creating finalized content. Creators might use it as a place to prototype and then copy code over to their work environment, but there will be no save or deploy capabilities within the playground.

# Key Dependencies and Open Questions

*What are the open questions that may need to be explored? Be explicit and honest about any “elephants in the room”.*

- How easy could it be to automatically add links to the playground from all snippets in our docs?
- What about 3d models and other assets like sound files? Would the tool be able to load example scenes that include these? Maybe it can have a base catalog with a handful of models from the Builder, just for testing? Or would it be restricted to just working with primitive shapes?
