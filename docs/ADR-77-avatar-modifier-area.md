# Avatar Modifier Area

## Context and Problem Statement

Creators should have the possibility to modify the avatars that enter their scene. 
This gives them the possiblity to show avatars as they intent, as well as enable/disable base functionality that collides with their scene content. 
The modifier area applies both for the user as well as the other players, but behaviour may be different in each case.
Any  modification that may be necessary for creators should be used only using Modifier Areas. At the moment of writing, camera modifier are treated differently than avatar modifier, which may lead to creators confussion.
A UI should tell the player which are the modifiers that are active at any given time, both affecting . If no modifier is on, this ui should dissapear completely.


## **Needs**

- Have a control structure that determines if a new avatar has entered an area.
- Have an interface for each Avatar Modifier that determines if behaviour has to change and how.
- Present a UI that clearly describes how avatars are being modified.
- Have the possibility to affect avatar in a different way depending if they are the self user or other user.

## **Existent Solution**

The current solution already covers most of the needs. Biggest changes respecting this one are:

- Who is going to handle the if the modifier area should be applied. This control currently being done inside the avatar, and not the corresponding modifier.
- Rething the way on how we present the UI. Currently, UI is only shown IF the self user enters the area; but if other avatars entered the area, no UI is displayed even though there are avatar near the self user being modified. This could be handled by adding more descriptive messages depending on who has enter the area. 
- Look for other modifiers that are not set as Avatar Modifier Areas. There are camera controls modifier that could be transformed to Avatar Modifier; putting everything under the same interface.

 ## **Techincal implementation**

- Have a GameObject representing the Avatar Modifier Area. This class should analyze the ins and outs of the avatars, and call the corresponding behaviour when necessary.
- Have a scalable way to create new AvatarModifierAreas. It should be easy enough to add a new modifier area when needed using an interface. This interface implementation should analyzes if the avatar that just entered/exit should be affected by the modifier. We want to be able to overlap modifier areas,
so there are case that even though the user has exited and area they should keep the modifier if another area is overlapping. This can be done using a counter of current affected areas. 
- This interfaces are going to look for objects that have their behaviour implemented. The final behaviour change is done on the objects that have implemented the modifier interface (for example: AvatarShape or AvatarController). There should be just one parent class that handles all modifiers, they should not be distributed
inside the Avatars prefab. How the avatar is handled is probably going to change if we are affecting the self user, or others; so we need to implement this variaton on each class. 
- This interface will also trigger the corresponding UI when necessary. This can be achieved by using a data structure through DataStore. Once again, the key to trigger the UI is in the counter of active areas. 
- The interface should be implemented using the Plugin system.



## Participants

- @dalkia
