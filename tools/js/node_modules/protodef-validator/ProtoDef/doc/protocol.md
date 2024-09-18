# Protocol

ProtoDef defines a protocol json format. It organizes types in namespaces.

Example:
```json
{
  "types": {
    "pstring": "native",
    "varint": "native"
  },
  "namespace1": {
    "types": {
      "mytype": [
        "pstring",
        "varint"
      ]
    },
    "namespace2": {
      "packet": "mytype"
    }
  }
}
```

> Don't define types with same name (or override types in child namespaces) because this will lead to implementation-defined behavior.
> Same with override of built-in types such as `u8`.

## **types** : { [String]: Type | "native", ... }
Arguments:
* [object] : a type definition
* * [key] : the name
* * [value] : the type (or `"native"` if implemented)
* * * 0 : name of used type
* * * 1 : options of used type

## **[String]** : { [namespace], ... }
Arguments:
* [object] : A namespace object
* * [key] : type name
* * [value] : namespace or type (see above) definition
