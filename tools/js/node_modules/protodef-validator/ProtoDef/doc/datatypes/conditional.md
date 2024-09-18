## Conditional

### **switch** ({ compareTo: Field, ?compareToValue: Any, fields: { [String]: Any, ... }, ?default: String })
Arguments:
* compareTo : the value is the other field
* compareToValue : an optional property (it's either compareTo or compareToValue) that allows the comparison to be made with a value instead of an other field
* fields : an object mapping the values to the types
* default : an optional property saying the type taken if the value doesn't fit into the cases

switch make it possible to choose a datatype depending on the value of an other field. 
It is similar to the switch/case syntax.

For `compareTo` variables, to go up one level when referencing a field, use "../".

Switch statement field names starting with "/" will reference a root variable. Root variables are primitives that can be used for comparisons and changed dynamically.

Example:

A switch which can encode a byte, a varint, a float or a string depending on "someField". 
If the value of someField is different, then the value encoded is of type void.
```json
[
  "switch",
  {
    "compareTo": "someField",
    "fields": {
      "0": "i8",
      "1": "varint",
      "2": "f32",
      "3": "string"
    },
    "default": "void"
  }
]
```
Example of value: `4.5`

### **option** ( Type )
Arguments:
* [Type] : the type of the value

Represents a simple optional type.
It's encoded as a boolean indicating whether the value is there or not.
It's similar to the `Optional` type in java or `Maybe` in haskell.

Example: An option of value string
```json
[
  "option",
  "cstring"
]
```
Example of value: `"my string"`
