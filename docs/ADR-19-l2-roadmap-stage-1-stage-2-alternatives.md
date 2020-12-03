# L2 Roadmap: Stage 1 & Stage 2 alternatives

## Objetive

Define the best strategy to have collections v2 in a l2 lowering the risk and time to market while increasing the value for users.

## Alt A: Collections v2 In-world Primary sales & Marketplace Secondary Sales: Divided UI

### Stage 1 🔶

- Users will be able to create collections v2 by paying X MANA by using the builder.

- Users will be able to perform primary sales of collections v2 items in-world (Explorer)

- Users will be able to perform secondary sales of collections v2 items in the marketplace. **These items will appear in a different section than the L1 items (UI).**

- Users will be able to deposit MANA from L1 to L2 by using the marketplace.

- Committee members will be able to approve/reject collections by using the builder

<!--
```dot
digraph {
    rankdir=LR
    graph [fontname = "arial", fontsize="10", color="grey", fontcolor="grey"]
    node [fontname = "arial",fontsize="10", shape="box", style="rounded"]
    edge [fontname = "arial",color="blue", fontcolor="black",fontsize="10"]

    users -&gt; explorer[color=orange, fontcolor=orange,  label="Perform primary sales"]
    users -&gt; marketplace[color=orange, fontcolor=orange,  label="Perform secondary sales"]
    explorer -&gt; collections [color=orange, fontcolor=orange]
    marketplace -&gt; collections [color=orange, fontcolor=orange]
    creators -&gt; collections[color=orange, fontcolor=orange  label="create"]
    commiteee -&gt; collections[color=orange, fontcolor=orange,  label="approve/reject"]

    edge[ style = invis ]
    users -&gt; { explorer marketplace }
}
```
-->

![resources/ADR-19/fig-l2-roadmap-stage-1-stage-2-alternatives-1.svg](resources/ADR-19/fig-l2-roadmap-stage-1-stage-2-alternatives-1.svg)

### Stage 2 🔷

- Users will be able to create/manage stores for collections v2 by using the builder.

- Users will be able to perform primary sales of collections v2 items in the marketplace. **These items will appear along with the L1 items (UI).**

- Users will be able to filter by stores in the marketplace.

- Users will be able to perform bids of collections v2 items in the marketplace.

<!--
```dot
digraph {
    rankdir=LR
    graph [fontname = "arial", fontsize="10", color="grey", fontcolor="grey"]
    node [fontname = "arial",fontsize="10", shape="box", style="rounded"]
    edge [fontname = "arial",color="blue", fontcolor="black",fontsize="10"]

    users -&gt; explorer[color=orange, fontcolor=orange,  label="Perform primary sales"]
    users -&gt; marketplace[color=blue, fontcolor=blue,  label="Perform primary sales"]
    users -&gt; marketplace[color=orange, fontcolor=orange,  label="Perform secondary sales"]
    users -&gt; marketplace[color=blue, fontcolor=blue,  label="Bid"]
    explorer -&gt; collections [color=orange, fontcolor=orange]
    marketplace -&gt; collections [color=orange, fontcolor=orange]
    creators -&gt; stores [color=blue, fontcolor=blue  label="create"]
    stores -&gt; collections[color=blue, fontcolor=blue  label="has"]
    commiteee -&gt; collections[color=orange, fontcolor=orange,  label="approve/reject"]


    edge[ style = invis ]
    users -&gt;  { explorer marketplace }
}
```
-->

![resources/ADR-19/fig-l2-roadmap-stage-1-stage-2-alternatives-1-1.svg](resources/ADR-19/fig-l2-roadmap-stage-1-stage-2-alternatives-1-1.svg)

## Alt B: Collections v2 In-world Primary sales & Marketplace Secondary Sales: Joined UI

### Stage 1 🔶

- Users will be able to create collections v2 by paying X MANA by using the builder.

- Users will be able to perform primary sales of collections v2 items in-world (Explorer)

- Users will be able to perform secondary sales of collections v2 items in the marketplace. **These items will appear along with the L1 items (UI).**

- Users will be able to deposit MANA from L1 to L2 by using the marketplace.

- Committee members will be able to approve/reject collections by using the builder

### Stage 2 🔷

- Users will be able to create/manage stores for collections v2 by using the builder.

- Users will be able to perform primary sales of collections v2 items in the marketplace.

- Users will be able to filter by stores in the marketplace.

- Users will be able to perform bids of collections v2 items in the marketplace.

_Graph is the same as ALT A_

## Alt C: Collections v2 Primary & Secondary Sales in the marketplace.

### Stage 1 🔶

- Users will be able to create collections v2 by paying X MANA by using the builder.

- Users will be able to perform primary and secondary sales of collections v2 items in the marketplace.

- Users will be able to deposit MANA from L1 to L2 by using the marketplace.

- Committee members will be able to approve/reject collections by using the builder

<!--
```dot
digraph {
    rankdir=LR
    graph [fontname = "arial", fontsize="10", color="grey", fontcolor="grey"]
    node [fontname = "arial",fontsize="10", shape="box", style="rounded"]
    edge [fontname = "arial",color="blue", fontcolor="black",fontsize="10"]

    users -&gt; marketplace[color=orange, fontcolor=orange,  label="Perform primary &amp;\n secondary sales"]
    marketplace -&gt; collections [color=orange, fontcolor=orange]
    creators -&gt; collections[color=orange, fontcolor=orange  label="create"]
    commiteee -&gt; collections[color=orange, fontcolor=orange,  label="approve/reject"]
}
```
-->

![resources/ADR-19/fig-l2-roadmap-stage-1-stage-2-alternatives-1-2.svg](resources/ADR-19/fig-l2-roadmap-stage-1-stage-2-alternatives-1-2.svg)

### Stage 2 🔷

- Users will be able to create/manage stores for collections v2 by using the builder.

- Users will be able to filter by stores in the marketplace.

- Users will be able to perform bids of collections v2 items in the marketplace.

<!--
```dot
digraph {
    rankdir=LR
    graph [fontname = "arial", fontsize="10", color="grey", fontcolor="grey"]
    node [fontname = "arial",fontsize="10", shape="box", style="rounded"]
    edge [fontname = "arial",color="blue", fontcolor="black",fontsize="10"]

    users -&gt; marketplace[color=orange, fontcolor=orange,  label="Perform primary &amp;\n secondary sales"]
    users -&gt; marketplace[color=blue, fontcolor=blue,  label="Bid"]
    marketplace -&gt; collections [color=orange, fontcolor=orange]
    creators -&gt; stores [color=blue, fontcolor=blue  label="create"]
    stores -&gt; collections[color=blue, fontcolor=blue  label="has"]
    commiteee -&gt; collections[color=orange, fontcolor=orange,  label="approve/reject"]
}
```
-->

![resources/ADR-19/fig-l2-roadmap-stage-1-stage-2-alternatives-1-3.svg](resources/ADR-19/fig-l2-roadmap-stage-1-stage-2-alternatives-1-3.svg)

## Decision outcome

### Alt A

#### Pros

- Lower time to market: As long as we can use the current marketplace design with a fewer changes, this alternative has less work for the Dapps team.

- Users are used to performing primary sales in-world (previous license events).

#### Cons

- The content team should create a scene/tutorial about how to perform primary sales of collection v2 items.

### Alt B ✅

#### Pros

- Users are used to performing in-world primary sales (previous license events).

#### Cons

- Dapps we will need to create a server to connect different sources (subgraphs) to display items from different layers altogether. This server will take ~4 weeks and it has dependencies hard to control and/or estimate. E.g: Thegraph does not support Matic testnet (Mumbai) and we need to host a node graph running it.

- The content team should create a scene/tutorial about how to perform primary sales of collection v2 items.

### Alt C

#### Pros

- No big dependencies from other teams rather than the dApps team.

#### Cons

- High effort and a long time to market.

## Open Questions

## Participants

- Nacho Mazzara

- Agustin Mendez

- Agustin Ferreira

- Esteban Ordano
