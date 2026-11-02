# Repository Architecture

## Key Details

* Language-independent repository holding data for many Minecraft versions, including Java Edition versions after 1.7 and Bedrock Edition versions after 1.16.
* Contains data on blocks, items, network protocol packet structures, entities, and more.
* The data in this repository is generated using several tools as described in the `doc/add-data-new-version.md` file for Java Edition and `doc/bedrock.md` for Bedrock Edition.

## File Structure

* Most data is stored in JSON format. The JSON schemas for these files are stored inside the `schemas/` directory.
* `data/pc` and `data/bedrock` contain directories of JSON data files for Java Edition and Bedrock Edition versions, respectively.
* `data/dataPaths.json` maps data types to their corresponding file paths, per Java Edition and Bedrock Edition versions.
  * It looks like `{"pc": { "1.16": {"blocks":"pc/1.16"} } }`, meaning Java Edition block data for version 1.16 can be found in `pc/1.16` in a file named `blocks.json`. If the data hasn't changed from version 1.15, it might point to `pc/1.15` instead.
* `tools/js` contains Node.js scripts for maintaining of the repository, such as running tests to ensure data validity, or generating some data found in the `data` directory.

## Usage

As documented in the `README.md`, several wrappers exist that expose the data inside the `data` directory.

Notably, this includes `PrismarineJS/node-minecraft-data`, which exposes the data as an npm package. 

## Contributing Tips

* Files should generally be obtained using a data extractor or generator, as mentioned above.
* When submitting a PR with new data, please describe how you obtained it. Even better, contribute a tool to extract that data automatically; otherwise, we will not be able to update that data for future versions.
* Check out the `.github/workflows` directory to see how tests are run on the repository.
