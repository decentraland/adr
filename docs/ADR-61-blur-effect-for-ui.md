# Blur Effect For UI

## Context and Problem Statement
For many of the UI designs, a blur effect to generate a glass-like effect was proposed.

A technical design for this effect is described in this document.

## Proposed Solution

The blur effect works by using a custom RenderFeature. This render feature uses the Opaque Texture provided by the Forward Renderer pipeline. This texture contains a snapshot of the Forward Renderer pipeline output and can be used as an input so the effect knows what is on the screen on advance to be able to blur it.

The render feature takes the opaque texture and blurs it using two passes--horizontal and vertical--with a reduced resolution to achieve a smooth-looking gaussian blur effect with fewer passes than an ad-hoc fragment shader approach.

In some cases, the blur has to act over other UI elements. For this to be possible, the UI elements that will be blurred have to be rendered by using a canvas that's set to "Screen Space - Camera" so they are included in this opaque texture to be used later. "Screen Space - Overlay" canvases are not blitted to the opaque texture, so those canvases can't be used as the blur source.

In a nutshell:

* A custom render feature must be added to the Forward Renderer, which will control the settings of the blur. This render feature requires a material that contains the logic that the blur will use.

* The UI elements that need to implement the blur effect, need to have the proper material, which will apply the effect automatically.

* Additionally, a custom C# script has to be used to control the blur parameters in runtime.

* The UI element that will have the effect needs to be set on “Screen Space - Overlay”, while the elements that are going to be blurred need to be on a different canvas set on “Screen Space - Camera”, otherwise the effect will not work.
* This means that multiple instances of the blur cannot be stacked on top of each other. If this happens, the foremost blur will have to be activated and all the other blurred elements that are behind it disabled. 

## Alternatives

At first, a simpler ad-hoc fragment shader based solution was considered. This fragment shader just uses a single pass gaussian kernel over the screen space opaque texture provided by the forward renderer. The issue with this technique is that as the source is not already blurred or low-res, so it needs a lot of iterations to be visually appealing. This turns out to be inviable and very detrimental to GPU performance. With low iterations, "ghosting" artifacts were observed so the better alternative was chosen instead.

## Participants

@brianamadori
@JuanMartinSalice