# Challenge

Before explaining the steps of the original function, I will re-write it using standard JS functions known to me
in order to help me understand what it is that it does, then I will come back to the original one and explain it step by step.

```
  R.reduce((acc,x) => R.compose(R.flip(R.prepend)(acc), R.sum,R.map(R.add(1)))([x,...acc]), [0])([13, 28])
```

## -->

```
  const f = R.reduce((acc,x) => {
    return R.compose(R.flip(R.prepend)(acc), R.sum,R.map(R.add(1)))([x,...acc])
  }, [0])

  f([13, 28])
```

## -->

```
  const f = R.reduce((acc,x) => {
    const g = R.compose(
      R.flip(R.prepend)(acc),
      R.sum,
      R.map(R.add(1))
    )

    return g([x,...acc])
  }, [0])

  f([13, 28])
```

## -->

```
  const f = R.reduce((acc,x) => {
    const h = R.flip(R.prepend)

    const g = R.compose(
      h(acc),
      R.sum,
      R.map(R.add(1))
    )

    return g([x,...acc])
  }, [0])

  f([13, 28])
```

## -->

```
  const h = (arr, el) => {
    arr.unshift(el)
    return arr
  }

  const g = (arr) => {
    const arrPlus1 = arr.map((a) => a + 1)
    const arrSum = arrPlus1.reduce((total, val) => total + val, 0)
    return h(arr.slice(1), arrSum)
  }

  const f = R.reduce((acc,x) => {
    return g([x,...acc])
  }, [0])

  f([13, 28])
```

## -->

```
  const h = (arr, el) => {
    arr.unshift(el)
    return arr
  }

  const g = (arr) => {
    const arrPlus1 = arr.map((a) => a + 1)
    const arrSum = arrPlus1.reduce((total, val) => total + val, 0)
    return h(arr.slice(1), arrSum)
  }

  f = (arr) => {
    return arr.reduce((acc, x) => g([x, ...acc]), [0])
  }

  f([13, 28])
```

## -->

```
  const sum = (arr) => {
    return arr.reduce((total, value) => total + value, 0)
  }

  const addOne = (arr) => arr.map((val) => val + 1)

  const f = (arr) => {
    const result = [0]

    let contentSum

    for (const value of arr) {
      contentSum = sum(
        addOne(result)
      ) + value + 1
      result.unshift(contentSum)
    }

    return result
  }

  f([13, 28])
```

## -->

```
  const sum = (arr) => {
    return arr.reduce((total, value) => total + value, 0)
  }

  const f = (arr) => {
    const result = [0]

    let contentSum

    for (let i = 0; i < arr.length; i++) {
      contentSum = sum([arr[i], ...result]) + result.length + 1
      result.unshift(contentSum)
    }

    return result
  }

  f([13, 28])
```

## Solution

Now the function is easier to understand. Given a numeric list it will produce a new one by prepending the accumulated sum of all elements
in the given list up to its position + the number of elements in the resulting list up to this point + 1 (the new element that will be added). The new
resulting list is always initialized with an list containing the 0 value only. So for instance, given the list [13, 28, 17, 29], the resulting list
will evolve like this:

- [0]
- [(13 + 0 + 1 + 1), 0] = [15, 0]
- [(28 + 15 + 0 + 2 + 1), 15, 0] = [46, 15, 0]
- [(17 + 46 + 15 + 0 + 3 + 1), 46, 15, 0] = [82, 46, 15, 0]
- [(29 + 82 + 46 + 15 + 0 + 4 + 1), 82, 46, 15, 0] = [177, 82, 46, 15, 0]
- [177, 82, 46, 15, 0]

Now I am ready to comment on the original one:

```
  R.reduce((acc,x) => R.compose(R.flip(R.prepend)(acc), R.sum,R.map(R.add(1)))([x,...acc]), [0])([13, 28])
```

Let me just rewrite it a little, so the steps become clearer.

```
  const f = R.reduce((acc,x) => {
    const h = R.flip(R.prepend)

    const g = R.compose(
      h(acc),
      R.sum,
      R.map(R.add(1))
    )

    return g([x,...acc])
  }, [0])

  f([13, 28])
```

This function starts by reducing the given list using [0] as the initial element, for each element in the list it does the following:

1. It creates a new list by prepending the current element to the current accumulated result: [x,...acc]
2. It maps this intermediary list by adding 1 to all of its values: R.map(R.add(1))
3. It sums all of the intermediary list's values using: R.sum
4. It prepends the resulting sum to the accumulated result list: R.flip(R.prepend)(acc, sum)
5. Steps 1 to 4 are repeated for all elements in the list.

Obs: Steps 2 to 4 are executed using a composed function it created using: R.compose(R.flip(R.prepend)(acc), R.sum,R.map(R.add(1))).

Now the advantages I can think for using such libraries are:

- A huge amount of optimized (probably) and pure functions available for immediate usage, so we don't need to implement them ourselves.
- A great community behind it, solving and issues, proposing improvements and adding funcionality.
- The functions are already tested.
- This specific lib: It's functions are implemented with currying in mind so they can be easily composed into more complex functions.
- This specific lib: Pure functions generate no side effects and store no state so we know that given the same input we will always get the same output.
