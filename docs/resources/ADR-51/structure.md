## Structure

Validates that entity pointers are present and not repeated

```
1. Fail if entity.pointers.length <= 0

2. Fail if Set(entity.pointers).size != entity.pointers.length
```
