## Structures

### **array** ({ type: Type, countType: Type, ?count: Countable })
Arguments:
* type : the type of the elements
* countType : the type of the length prefix
* count : optional (either count or countType), a reference to the field counting the elements, or a fixed size (an integer)

Represents a list of values with same type.

Example: An array of int prefixed by a short length.
```json
[
  "array",
  {
    "countType": "i16",
    "type": "i32"
  }
]
```
Example of value: `[1, 2, 3, 4]` (type = [i8](./numeric.md)) / `["ac", "dc"]` (type = [cstring](./utils.md))

### **container** ([ { name: String, type: Type }, ... ])
Arguments: 
* [array] : a field
* * name : the name of field
* * type : the type of field

Represents a list of named values.

Example: A container with fields of type int, int, ushort and ushort.
```json
[
  "container",
  [
    { "name": "x", "type": "i32" },
    { "name": "z", "type": "i32" },
    { "name": "bitMap", "type": "u16" },
    { "name": "addBitMap", "type": "u16" }
  ]
]
```
Example of value: `{"x": 10, "z": 10, "bitMap": 10, "addBitMap": 10}`

### **count** ({ type: Type, countFor: Field })
Arguments:
* type : the type of count
* countFor : a field to count for

Represents a count field for an array or a buffer. 

Example: A count for a field name records, of type short.
```json
[
  "count",
  {
    "type": "i16",
    "countFor": "records"
  }
]
```
Example of value: `4`