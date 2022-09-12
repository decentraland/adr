## Scene Access

```
parameter SCENE_LOOKBACK_TIME = 300000 (ms)
function checkParcelAccess:
  1. Let parcel P be the parcel of X, Y
  3. For each target T in P U P.states
    a. You get direct access if you were the:
        - owner
        - operator
        - update operator
      at that time

    b. You also get access if you received:
        - an authorization with isApproved and type Operator, ApprovalForAll or UpdateManager
      at that time

----

1. For each pointer P in deployment.pointers // lowercase
  a. Let X, Y be P.split(,)
  b. Fail if !checkParcelAccess(x,y, deployment.timestamp)
  and !checkParcelAccess(x,y, deployment.timestamp - SCENE_LOOKBACK_TIME)

```
