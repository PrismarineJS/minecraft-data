## Numeric

These datatypes represent numbers. Most of them don't take any arguments.
They default to big-endian encoding. To use little-endian, prefix its name with "l".

| Name    | Size in bytes | Example of value    | Also called                  |
| ---     | ---           | ---                 | ---                          |
| i8      | 1             | -125                | byte                         |
| u8      | 1             | 255                 | unsigned byte                |
| i16     | 2             | -32000              | short                        | 
| u16     | 2             | 60000               | unsigned short               |
| i32     | 4             | -2000000000         | int                          |
| u32     | 4             | 3000000000          | unsigned int                 |
| f32     | 4             | 4.5                 | float                        |
| f64     | 8             | 4.5                 | double                       |
| i64     | 8             | 1                   | long                         |
| u64     | 8             | 1                   | unsigned long                |
| varint  | (varies)      | 300                 | int var                      |

### **int** ({ size: Integer })
Arguments:
* size : fixed size in bytes

Represents a unsigned integer using `size` bytes.

Example:
```json
[
  "int",
  { "size": "3" }
]
```
Example of value: `65535` (size = 2) / `16777215` (size = 3)

### **varint** ( )
Arguments: None

[Protobuf](https://developers.google.com/protocol-buffers/docs/encoding#varints)-compatible representation for variable-length integers using one or more bytes.

Example of value: `300` (size is 2 bytes)
