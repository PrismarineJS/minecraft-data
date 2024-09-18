## Utils

### **buffer** ({ countType: Type, ?count: Countable, ?rest: Boolean })
Arguments:
* countType : the type of the length prefix
* count : optional (either count or countType), a reference to the field counting the elements, or a fixed size (an integer)
* rest : optional (either rest or count/countType), represent rest bytes as-is

Represents a raw bytes with count prefix/field or without it.

Example: An buffer prefixed by a varint length.
```json
[
    "buffer",
    { "countType": "varint" }
]
```

Example of value: `Buffer <01 02 03>` / `Buffer <fe ed 00 ff>`

### **bitfield** ([ { name: String, size: Integer, signed: Boolean } ])
Arguments:
* [array] : a field
* * name : the name of field
* * size : the size in bits
* * signed : is value signed

Represents a list of value with sizes that are not a multiple of 8bits.
The sum of the sizes must be a multiple of 8.

Example:

3 values, x, y and z with sizes in bits : 26, 12, 26. Notice that 26+12+26=64.
```json
[
  "bitfield",
  [
    { "name": "x", "size": 26, "signed": true },
    { "name": "y", "size": 12, "signed": true },
    { "name": "z", "size": 26, "signed": true }
  ]
]
```

Example of value: `{"x": 10, "y": 10, "z": 10}`

### **mapper** ({ type: Type, mappings: { [String]: Any, ... } })
Arguments:
* type : the type of the input
* mappings : a mappings object

Maps string to a values.

Example:

Maps a byte to a string, 1 to "byte", 2 to "short", 3 to "int", 4 to "long".
```json
[
  "mapper",
  {
    "type": "i8",
    "mappings": {
      "1": "byte",
      "2": "short",
      "3": "int",
      "4": "long"
    }
  }
]
```
Example of value: `"int"`

### **pstring** ({ countType: Type, ?count: Countable })
Arguments:
* countType : the type of the length prefix
* count : optional (either count or countType), a reference to the field counting the elements, or a fixed size (an integer)

Represents a string.

Example: A string length prefixed by a varint.
```json
[
  "pstring", { "countType": "varint" }
]
```
Example of value: `"my string"`