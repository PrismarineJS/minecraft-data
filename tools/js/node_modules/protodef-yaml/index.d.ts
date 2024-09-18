module "protodef-yaml" {
    // Convert protodef-yaml encoded string to JSON object
    export function compile(inputFile: string, outputFile: string): object
    // Returns intermediate representation for protodef-yaml
    export function parse(inputFile: string, includeComments?: boolean, followImports?: boolean): object
    export function genHTML(parsedObject: object, options?: { toTitleCase?: boolean, includeHeader?: boolean, schemaSegmented?: boolean }): string
    export function genYAML(json: object): string
}